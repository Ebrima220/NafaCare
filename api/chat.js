// Words are streamed back as they are written. Edge starts faster than a
// Node function; the Node branch is the local and fallback path.
import { openChatStream, writeChatToNodeResponse } from '../server/gemini.js'

export const runtime = 'edge'
export const config = { runtime: 'edge' }

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function edgeHandler(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  let body = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const opened = openChatStream(body.messages)
  if (opened.body) return jsonResponse(opened.body, opened.status)

  return new Response(opened.stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}

export default async function handler(request, response) {
  // Vercel Node still passes (req, res). Edge passes a Web Request only.
  if (response && typeof response.end === 'function') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST')
      response.statusCode = 405
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: 'Method not allowed.' }))
      return
    }
    await writeChatToNodeResponse(response, request.body?.messages)
    return
  }

  return edgeHandler(request)
}
