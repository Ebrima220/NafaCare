// Server-only Gemini client. The browser must never import this file.
// The API key is read from the process environment, not from the Vite bundle.

const SYSTEM_PROMPT = `You are NafaCare AI, a strictly health-focused assistant for The Gambia's health sector.

## Strict Scope Rules — follow these without exception:
1. You ONLY respond to:
   a. Health-related questions and topics (symptoms, diseases, treatments, medications, nutrition, mental health, preventive care, etc.).
   b. Greetings and salutations (e.g. "Hello", "Hi", "Good morning", "Assalamu Alaikum", etc.) — reply briefly and warmly, then invite a health question.
   c. Thank-you or appreciation messages (e.g. "Thank you", "Thanks", "Appreciate it") — acknowledge briefly and warmly.

2. For ANY message that is NOT health-related, NOT a greeting, and NOT a thank-you, you MUST respond with exactly:
   "I'm only able to help with health-related questions. Please ask me about symptoms, diseases, treatments, nutrition, or any other health topic."
   Do not attempt to answer, explain, or engage with off-topic content in any way.

3. Never make exceptions to rule 2, regardless of how the request is framed, rephrased, or presented.

## When answering health questions:
- Provide health information specifically relevant to The Gambia and West African context.
- Prioritize information relevant to tropical and sub-Saharan African health challenges (malaria, typhoid, HIV/AIDS, maternal health, etc.).
- Reference local healthcare facilities, services, and resources in The Gambia when relevant.
- Consider local cultural sensitivities, traditional medicine practices, and healthcare accessibility.
- Provide practical advice suitable for the Gambian climate, environment, and healthcare infrastructure.
- When discussing medications or treatments, mention availability and affordability in The Gambian context when possible.
- Be empathetic, culturally sensitive, clear, and avoid unnecessary jargon.
- If a symptom sounds potentially serious or emergency-level, always advise the user to seek immediate medical care at nearby health facilities.
- Keep answers short: a few bullets and one "Bottom line" sentence. Do not write a long essay.
- Do NOT include disclaimers or warnings in your responses — these are shown separately in the interface.

Context: You are serving Gambian residents and visitors to The Gambia. Tailor your responses to be practical and actionable within The Gambia's health system.`

// Gemini 3 Flash defaults to medium thinking, which delays the first word by
// several seconds. minimal/low is the fast setting for a health Q&A.
const DEFAULT_MODEL = 'gemini-3.6-flash'
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash']

const MISSING_KEY_ERROR =
  'The AI assistant is not configured. In Vercel, open Settings → Environment Variables, add GEMINI_API_KEY, then redeploy.'
const BUSY_ERROR = 'The AI service is busy right now. Please wait a moment and try again.'
const DOWN_ERROR = 'The AI assistant is currently unavailable. Please try again in a few moments.'
const EMPTY_ERROR = 'The AI service returned an empty response. Please try again.'
const BAD_KEY_ERROR =
  'The AI assistant rejected the server API key. Check GEMINI_API_KEY in Vercel and redeploy.'

let cachedModel = null

export function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  )
}

function candidateModels() {
  const preferred = (process.env.GEMINI_MODEL || '').trim()
  const names = [cachedModel, preferred || DEFAULT_MODEL, ...FALLBACK_MODELS]
  const unique = []
  for (const name of names) {
    if (name && !unique.includes(name)) unique.push(name)
  }
  return unique.slice(0, 3)
}

// Gemini 3.7/3.8 reject "minimal". Gemini 2.5 uses a token budget, and 0 turns thinking off.
function thinkingPlans(model) {
  const id = String(model || '').toLowerCase()
  if (/gemini-2\./.test(id)) return [{ thinkingBudget: 0 }]
  if (/gemini-3\.(7|8)/.test(id) || id.includes('pro')) return [{ thinkingLevel: 'low' }]
  return [{ thinkingLevel: 'minimal' }, { thinkingLevel: 'low' }]
}

function generationConfig(thinking) {
  const config = { maxOutputTokens: 1024 }
  if (thinking) config.thinkingConfig = thinking
  return config
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'No messages were provided.', status: 400 }
  }

  // Long histories make every reply slower. Keep the latest turns only.
  let recent = messages.slice(-8)
  if (recent[0]?.role === 'assistant') recent = recent.slice(1)

  const contents = []
  for (const message of recent) {
    const role = message?.role === 'assistant' ? 'model' : message?.role === 'user' ? 'user' : null
    const content = String(message?.content || '').trim().slice(0, 4000)
    if (!role || !content) continue
    contents.push({ role, parts: [{ text: content }] })
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    return { error: 'No messages were provided.', status: 400 }
  }

  return { contents }
}

function thinkingRejected(status, detail) {
  return status === 400 && /thinking/i.test(detail || '')
}

async function readError(response) {
  const errJson = await response.json().catch(() => ({}))
  return errJson?.error?.message || ''
}

async function streamModel(model, apiKey, contents, onText, thinking) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: generationConfig(thinking),
      }),
    },
  )

  if (!response.ok) {
    const detail = await readError(response)
    console.error(`Gemini ${model} failed (${response.status}): ${detail}`)
    return { ok: false, status: response.status, detail }
  }

  const reader = response.body?.getReader()
  if (!reader) return { ok: false, status: 502, detail: 'no stream' }

  const decoder = new TextDecoder()
  let buffer = ''
  let gotText = false

  const consume = (block) => {
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const json = trimmed.slice(5).trim()
      if (!json || json === '[DONE]') continue
      let chunk
      try {
        chunk = JSON.parse(json)
      } catch {
        continue
      }
      const parts = chunk?.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (!part?.text || part.thought) continue
        gotText = true
        onText(part.text)
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''
    for (const block of blocks) consume(block)
  }
  if (buffer.trim()) consume(buffer)

  if (!gotText) return { ok: false, status: 502, detail: 'empty' }
  return { ok: true }
}

function sseStream(contents, apiKey) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }
      let sentText = false

      try {
        // A comment frame makes proxies flush the headers before the model replies.
        controller.enqueue(encoder.encode(': stream\n\n'))

        let sawRateLimit = false
        for (const model of candidateModels()) {
          let result = null
          try {
            for (const thinking of thinkingPlans(model)) {
              result = await streamModel(
                model,
                apiKey,
                contents,
                (text) => {
                  sentText = true
                  send({ text })
                },
                thinking,
              )
              if (result.ok || sentText || !thinkingRejected(result.status, result.detail)) break
            }
          } catch (error) {
            console.error(`Gemini ${model} stream error:`, error?.message || error)
            if (sentText) {
              send({ error: DOWN_ERROR })
              return
            }
            continue
          }

          if (result?.ok) {
            cachedModel = model
            send({ done: true })
            return
          }
          if (sentText) {
            send({ error: EMPTY_ERROR })
            return
          }
          if (result?.status === 401 || result?.status === 403) {
            send({ error: BAD_KEY_ERROR })
            return
          }
          if (result?.status === 429) {
            sawRateLimit = true
            break
          }
        }

        send({ error: sawRateLimit ? BUSY_ERROR : DOWN_ERROR })
      } catch (error) {
        console.error('Gemini stream error:', error?.message || error)
        if (!sentText) send({ error: DOWN_ERROR })
      } finally {
        controller.close()
      }
    },
  })
}

// JSON for errors we know before calling Gemini. A stream once the model is in play,
// so the browser can show words as they arrive instead of waiting for the full answer.
export function openChatStream(messages) {
  const normalized = normalizeMessages(messages)
  if (normalized.error) {
    return { status: normalized.status, body: { error: normalized.error } }
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return { status: 503, body: { error: MISSING_KEY_ERROR } }
  }

  return { status: 200, stream: sseStream(normalized.contents, apiKey) }
}

export async function writeChatToNodeResponse(res, messages) {
  try {
    const opened = openChatStream(messages)
    if (opened.body) {
      res.statusCode = opened.status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(opened.body))
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') res.flushHeaders()

    const reader = opened.stream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!res.write(value)) {
        await new Promise((resolve) => res.once('drain', resolve))
      }
    }
    res.end()
  } catch (error) {
    console.error('Chat route error:', error?.message || error)
    if (res.headersSent) {
      try { res.end() } catch { /* client already gone */ }
      return
    }
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: DOWN_ERROR }))
  }
}
