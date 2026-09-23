// Vercel serverless function: POST /api/chat
// The Gemini API key stays in this process. The React app only calls this route.
import { writeChatToNodeResponse } from '../server/gemini.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  await writeChatToNodeResponse(res, req.body?.messages)
}
