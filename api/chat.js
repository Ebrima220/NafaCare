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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const { messages = [] } = req.body || {}

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No messages were provided.' })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        error: 'The AI assistant is currently unavailable. Please try again in a few moments.',
      })
    }

    const payload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map(({ role, content }) => ({
        role: role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(content || '').slice(0, 12000) }],
      })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'The AI assistant is currently unavailable. Please try again in a few moments.',
      })
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''

    if (!text) {
      return res.status(502).json({ error: 'The AI service returned an empty response.' })
    }

    return res.status(200).json({ text })
  } catch (error) {
    console.error('Gemini API route error:', error)
    return res.status(500).json({
      error: 'The AI service is temporarily unavailable. Please try again in a few moments.',
    })
  }
}
