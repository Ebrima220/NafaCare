import { useState, useRef, useEffect } from 'react'

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are NafaCare AI, an expert health research assistant.
Your role:
- Answer health questions with accurate, evidence-based information.
- When asked about a health topic, do deep research reasoning and provide a clear, structured summary.
- Structure longer answers with short headings, bullet points, and a "Bottom line" section.
- Always remind users that your information is for educational purposes only and not a substitute for professional medical advice.
- Be empathetic, clear, and avoid unnecessary jargon.
- If a symptom described sounds potentially serious or emergency-level, always advise the user to seek immediate medical care.`

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

async function fetchAIResponse(messages, onChunk) {
  if (!API_KEY) {
    const fallback =
      'To enable the AI assistant, add your OpenRouter API key to a `.env` file at the project root:\n\n```\nVITE_OPENROUTER_API_KEY=your_key_here\n```\n\nGet a free key at **openrouter.ai** — no credit card required.'
    for (const char of fallback) {
      onChunk(char)
      await new Promise((r) => setTimeout(r, 8))
    }
    return
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'NafaCare',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-8b-instruct:free',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
    for (const line of lines) {
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) onChunk(delta)
      } catch { /* skip malformed */ }
    }
  }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let key = 0
  for (const line of lines) {
    if (line.startsWith('### ') || line.startsWith('## ')) {
      elements.push(<p key={key++} className="mt-3 font-bold text-slate-800 dark:text-slate-100 text-sm">{line.replace(/^##+ /, '')}</p>)
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(<p key={key++} className="mt-2 font-semibold text-slate-700 dark:text-slate-200 text-sm">{line.slice(2, -2)}</p>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(<li key={key++} className="ml-4 text-[13px] text-slate-600 dark:text-slate-300 list-disc">{inlineFormat(line.slice(2))}</li>)
    } else if (line.startsWith('```')) {
      // skip fences
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />)
    } else {
      elements.push(<p key={key++} className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{inlineFormat(line)}</p>)
    }
  }
  return elements
}

function inlineFormat(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-slate-700 dark:text-slate-200">{part.slice(2, -2)}</strong>
      : part
  )
}

const SUGGESTIONS = [
  'What are early signs of diabetes?',
  'How much water should I drink daily?',
  'Best foods for heart health?',
  'How to improve sleep quality?',
  'What causes high blood pressure?',
]

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${isUser ? 'bg-green-600 text-white' : 'bg-emerald-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${isUser ? 'bg-green-600 text-white text-[13px] leading-relaxed' : 'bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600'}`}>
        {isUser ? <p className="text-[13px] leading-relaxed">{msg.content}</p> : <div>{renderMarkdown(msg.content)}</div>}
        {msg.streaming && <span className="inline-block h-3 w-1.5 animate-pulse rounded-sm bg-green-500 ml-0.5" />}
      </div>
    </div>
  )
}

// ─── Main AiChat ──────────────────────────────────────────────────────────────
export default function AiChat({ open, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 350) }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function sendMessage(text) {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')
    setError('')
    const updated = [...messages, { role: 'user', content: userText }]
    setMessages(updated)
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])
    try {
      await fetchAIResponse(
        updated.map(({ role, content }) => ({ role, content })),
        (chunk) => setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last.role === 'assistant') copy[copy.length - 1] = { ...last, content: last.content + chunk }
          return copy
        }),
      )
    } catch (e) { setError(e.message) }
    finally {
      setMessages((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last.role === 'assistant') copy[copy.length - 1] = { ...last, streaming: false }
        return copy
      })
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300" onClick={onClose} />
      )}

      <div
        className={`
          fixed z-50 flex flex-col bg-white dark:bg-slate-900 shadow-2xl
          transition-all duration-300 ease-out
          inset-x-0 bottom-0 h-[92dvh] rounded-t-3xl
          ${open ? 'translate-y-0' : 'translate-y-full'}
          md:inset-x-auto md:right-0 md:top-[64px] md:bottom-0
          md:h-auto md:w-[400px] md:rounded-l-2xl md:rounded-tr-none
          md:border-l md:border-gray-200 dark:md:border-slate-700
          ${open ? 'md:translate-x-0 md:translate-y-0' : 'md:translate-x-full md:translate-y-0'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="NafaCare AI Health Assistant"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 md:rounded-tl-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white leading-tight">NafaCare AI</p>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
              </div>
              <p className="text-[11px] text-green-100">Health Research Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setError('') }} className="rounded-full p-2 text-green-100 hover:bg-white/20 transition" title="Clear chat">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-2 text-green-100 hover:bg-white/20 transition" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 dark:border-amber-900/40 dark:bg-amber-900/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 flex-shrink-0 text-amber-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
            For educational purposes only — not a substitute for professional medical advice.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 py-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-7 w-7 text-green-600 dark:text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Ask me anything about health</h3>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">I research and summarise health topics for you.</p>
              </div>
              <div className="w-full space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Suggested</p>
                {SUGGESTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[12px] text-slate-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">⚠ {error}</div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-gray-100 bg-white px-3 py-3 pb-[env(safe-area-inset-bottom,12px)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition dark:border-slate-600 dark:bg-slate-800 dark:focus-within:border-green-500 dark:focus-within:ring-green-900/40">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a health question…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-[13px] text-slate-700 placeholder-slate-400 outline-none disabled:opacity-50 dark:text-slate-200 dark:placeholder-slate-500"
              style={{ maxHeight: '100px' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-500">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  )
}
