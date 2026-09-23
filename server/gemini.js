// Server-only Gemini client. The browser must never import this file.
// The API key is read from the process environment, not from the Vite bundle.

const SYSTEM_PROMPT = `You are NafaCare AI for people in The Gambia. Answer only health questions, greetings, and thanks.

If the message is anything else, reply with exactly:
"I'm only able to help with health-related questions. Please ask me about symptoms, diseases, treatments, nutrition, or any other health topic."
Do not answer off-topic requests, even if they are rephrased.

For health questions:
- Be practical for The Gambia: malaria, typhoid, HIV, maternal health, heat, cost, and where to get care.
- If it may be an emergency, tell them to get medical care now.
- Use at most 4 short bullets and one "Bottom line" sentence.
- No disclaimer. The app shows that separately.`

// Gemini 3 Flash thinks before it writes, which adds seconds. 2.5 Flash with
// thinking off, then Flash-Lite, starts the reply much sooner.
const DEFAULT_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODEL = 'gemini-3.5-flash-lite'

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
  const names = [cachedModel, preferred || DEFAULT_MODEL, FALLBACK_MODEL]
  const unique = []
  for (const name of names) {
    if (name && !unique.includes(name)) unique.push(name)
  }
  // The first model answers. The second is tried only if that model name is unavailable.
  return unique.slice(0, 2)
}

// Gemini 2.5 can turn thinking fully off. Newer Flash models cannot, so use their lowest level.
function generationConfig(model) {
  const id = String(model || '').toLowerCase()
  const config = { maxOutputTokens: 384 }
  if (/gemini-2\./.test(id)) config.thinkingConfig = { thinkingBudget: 0 }
  else if (/gemini-3\.(7|8)/.test(id) || id.includes('pro')) config.thinkingConfig = { thinkingLevel: 'low' }
  else config.thinkingConfig = { thinkingLevel: 'minimal' }
  return config
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'No messages were provided.', status: 400 }
  }

  // Older turns add delay and are not needed for the next short answer.
  let recent = messages.slice(-4)
  if (recent[0]?.role === 'assistant') recent = recent.slice(1)

  const contents = []
  for (const message of recent) {
    const role = message?.role === 'assistant' ? 'model' : message?.role === 'user' ? 'user' : null
    const content = String(message?.content || '').trim().slice(0, 2000)
    if (!role || !content) continue
    contents.push({ role, parts: [{ text: content }] })
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    return { error: 'No messages were provided.', status: 400 }
  }

  return { contents }
}

async function readError(response) {
  const errJson = await response.json().catch(() => ({}))
  return errJson?.error?.message || ''
}

async function streamModel(model, apiKey, contents, onText) {
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
        generationConfig: generationConfig(model),
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
            result = await streamModel(
              model,
              apiKey,
              contents,
              (text) => {
                sentText = true
                send({ text })
              },
            )
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
