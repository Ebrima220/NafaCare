// Vercel serverless function: POST /api/chat
// The Gemini API key stays in this process. The React app only calls this route.
import { generateChat } from '../server/gemini.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const result = await generateChat(req.body?.messages)
    return res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Chat route error:', error?.message || error)
    return res.status(500).json({
      error: 'The AI service is temporarily unavailable. Please try again in a few moments.',
    })
  }
}
