import { useState, useRef, useEffect } from 'react'

// ─── System prompt ────────────────────────────────────────────────────────────
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

function getFriendlyAiError(error) {
  const raw = error?.message || String(error || '')
  const message = raw
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!message) return 'The AI assistant is temporarily unavailable. Please try again in a moment.'

  const lower = message.toLowerCase()

  if (lower.includes('api key') || lower.includes('invalid key') || lower.includes('rejected') || lower.includes('gemini')) {
    return 'The AI is not configured correctly on this site. Please add a valid Gemini API key in Vercel and try again.'
  }

  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'The AI service is busy right now. Please wait a moment and try again.'
  }

  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('fetch') || lower.includes('network') || lower.includes('timeout')) {
    return 'The AI service is temporarily unavailable. Please try again in a few moments.'
  }

  return 'Something went wrong while generating the response. Please try again.'
}

async function fetchAIResponse(messages, onChunk) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    let payload = {}
    try {
      payload = await response.json()
    } catch {
      payload = {}
    }

    const message = payload.error || 'The AI assistant is temporarily unavailable. Please try again.'
    throw new Error(message)
  }

  const data = await response.json().catch(() => ({}))
  const text = typeof data.text === 'string' ? data.text : ''

  if (!text) {
    throw new Error('The AI assistant returned an empty response. Please try again.')
  }

  for (const char of text) {
    onChunk(char)
    await new Promise((resolve) => setTimeout(resolve, 8))
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
  'How can I prevent malaria in The Gambia?',
  'What are common symptoms of typhoid fever?',
  'Where can I get tested for HIV in Banjul?',
  'How to treat dehydration during hot season?',
  'Best foods for pregnant women in Gambia?',
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
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false)
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
    } catch (e) {
      const message = getFriendlyAiError(e)
      setError(message)
      setMessages((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last && last.role === 'assistant') {
          copy[copy.length - 1] = {
            ...last,
            content: message,
            streaming: false,
            error: true,
          }
        }
        return copy
      })
    } finally {
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
        {!disclaimerDismissed && (
          <div className="flex items-start gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0 text-blue-500 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-snug">
                This AI assistant provides health guidance to help you understand symptoms and find appropriate care. Always consult qualified healthcare professionals for diagnosis and treatment.
              </p>
            </div>
            <button 
              onClick={() => setDisclaimerDismissed(true)}
              className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        )}

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
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Ask me a health question</h3>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">I only answer health-related questions for you.</p>
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
