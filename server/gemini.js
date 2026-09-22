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
- Structure longer answers with short headings, bullet points, and a "Bottom line" section.
- Do NOT include disclaimers or warnings in your responses — these are shown separately in the interface.

Context: You are serving Gambian residents and visitors to The Gambia. Tailor your responses to be practical and actionable within The Gambia's health system.`

const MODEL_CANDIDATES = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
]

function isChatModel(name) {
  const id = String(name || '').toLowerCase()
  if (!id.includes('gemini')) return false
  const blocked = ['tts', 'embedding', 'imagen', 'image', 'aqa', 'robotics', 'computer-use', 'native-audio', 'audio', 'live']
  return !blocked.some((word) => id.includes(word))
}

const MISSING_KEY_ERROR =
  'The AI assistant is not configured. In Vercel, open Settings → Environment Variables, add GEMINI_API_KEY, then redeploy.'

export function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  )
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'No messages were provided.', status: 400 }
  }
  if (messages.length > 20) {
    return { error: 'The conversation is too long. Clear the chat and try again.', status: 400 }
  }

  const contents = []
  for (const message of messages) {
    const role = message?.role === 'assistant' ? 'model' : message?.role === 'user' ? 'user' : null
    const content = String(message?.content || '').trim().slice(0, 8000)
    if (!role || !content) continue
    contents.push({ role, parts: [{ text: content }] })
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    return { error: 'No messages were provided.', status: 400 }
  }

  return { contents }
}

async function requestModel(model, apiKey, payload) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  if (response.ok) {
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || ''
    if (!text) {
      return { ok: false, fatal: true, status: 502, error: 'The AI service returned an empty response. Please try again.' }
    }
    return { ok: true, text }
  }

  const errJson = await response.json().catch(() => ({}))
  const detail = errJson?.error?.message || ''
  console.error(`Gemini ${model} failed (${response.status}): ${detail}`)

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      fatal: true,
      status: 502,
      error: 'The AI assistant rejected the server API key. Check GEMINI_API_KEY in Vercel and redeploy.',
    }
  }

  // Try the next model. A 429 on one model should not hide a working model.
  return { ok: false, fatal: false, status: response.status }
}

async function discoverModels(apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=50&key=${apiKey}`,
    )
    if (!response.ok) return []
    const data = await response.json()
    return (data.models || [])
      .filter((model) =>
        (model.supportedGenerationMethods || []).includes('generateContent') &&
        isChatModel(model.name),
      )
      .map((model) => String(model.name).replace(/^models\//, ''))
  } catch (error) {
    console.error('Gemini model discovery failed:', error?.message || error)
    return []
  }
}

export async function generateChat(messages) {
  const normalized = normalizeMessages(messages)
  if (normalized.error) {
    return { status: normalized.status, body: { error: normalized.error } }
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return { status: 503, body: { error: MISSING_KEY_ERROR } }
  }

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: normalized.contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  }

  const preferred = [process.env.GEMINI_MODEL, ...MODEL_CANDIDATES].filter(Boolean)
  const tried = new Set()

  for (const model of preferred) {
    tried.add(model)
    const result = await requestModel(model, apiKey, payload)
    if (result.ok) return { status: 200, body: { text: result.text } }
    if (result.fatal) return { status: result.status, body: { error: result.error } }
  }

  const discovered = await discoverModels(apiKey)
  let sawRateLimit = false
  for (const model of discovered) {
    if (tried.has(model) || !isChatModel(model)) continue
    const result = await requestModel(model, apiKey, payload)
    if (result.ok) return { status: 200, body: { text: result.text } }
    if (result.fatal) return { status: result.status, body: { error: result.error } }
    if (result.status === 429) sawRateLimit = true
  }

  if (sawRateLimit) {
    return {
      status: 429,
      body: { error: 'The AI service is busy right now. Please wait a moment and try again.' },
    }
  }

  return {
    status: 502,
    body: { error: 'The AI assistant is currently unavailable. Please try again in a few moments.' },
  }
}
