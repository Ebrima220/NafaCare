import { useState, useRef, useEffect } from 'react'

// The browser only talks to our own server. Gemini and the API key live in /api/chat.
function getFriendlyAiError(error) {
  const raw = error?.message || String(error || '')
  const message = raw
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!message) return 'The AI assistant is currently unavailable. Please try again in a few moments.'

  const lower = message.toLowerCase()

  if (
    lower.includes('not configured') ||
    lower.includes('api key') ||
    lower.includes('invalid key') ||
    lower.includes('rejected') ||
    lower.includes('gemini') ||
    lower.includes('configured correctly on this site')
  ) {
    return 'The AI assistant is currently unavailable. Please try again in a few moments.'
  }

  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'The AI service is busy right now. Please wait a moment and try again.'
  }

  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('fetch') || lower.includes('network') || lower.includes('timeout')) {
    return 'The AI assistant is currently unavailable. Please try again in a few moments.'
  }

  return 'Something went wrong while generating the response. Please try again.'
}

async function fetchAIResponse(messages, onChunk) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const type = response.headers.get('content-type') || ''
  if (type.includes('application/json') || !response.ok) {
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.error || 'The AI assistant is temporarily unavailable. Please try again.')
    }
    const text = typeof payload.text === 'string' ? payload.text.trim() : ''
    if (!text) throw new Error('The AI assistant returned an empty response. Please try again.')
    onChunk(text)
    return
  }

  if (!response.body) {
    throw new Error('The AI assistant is temporarily unavailable. Please try again.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let received = false

  const handleBlock = (block) => {
    const dataLine = block.split('\n').map((line) => line.trim()).find((line) => line.startsWith('data:'))
    if (!dataLine) return
    let event
    try {
      event = JSON.parse(dataLine.slice(5).trim())
    } catch {
      return
    }
    if (event.error) {
      if (!received) throw new Error(event.error)
      return
    }
    if (typeof event.text === 'string' && event.text) {
      received = true
      onChunk(event.text)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) handleBlock(block)
    }
    if (buffer.trim()) handleBlock(buffer)
  } catch (error) {
    if (!received) throw error
  }

  if (!received) {
    throw new Error('The AI assistant returned an empty response. Please try again.')
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
      <div className={`min-w-0 max-w-[82%] break-words rounded-2xl px-3 py-2 ${isUser ? 'bg-green-600 text-white text-[13px] leading-relaxed' : 'bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600'}`}>
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
  const panelRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    if (!open) return
    // Focusing on a phone opens the keyboard immediately and covers the send button.
    if (window.matchMedia('(min-width: 1024px)').matches) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const viewport = window.visualViewport
    const panel = panelRef.current
    if (!viewport || !panel) return

    const placeAboveKeyboard = () => {
      const desktop = window.matchMedia('(min-width: 1024px)').matches
      if (desktop) {
        panel.style.bottom = ''
        panel.style.height = ''
        return
      }
      const keyboard = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)
      panel.style.bottom = `${keyboard}px`
      // While typing, fit the sheet to the visible screen so the send button stays on it.
      panel.style.height = keyboard > 0 ? `${Math.max(240, viewport.height - 8)}px` : ''
    }

    viewport.addEventListener('resize', placeAboveKeyboard)
    viewport.addEventListener('scroll', placeAboveKeyboard)
    placeAboveKeyboard()
    return () => {
      viewport.removeEventListener('resize', placeAboveKeyboard)
      viewport.removeEventListener('scroll', placeAboveKeyboard)
      panel.style.bottom = ''
      panel.style.height = ''
    }
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function sendMessage(text) {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
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

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] min-w-0 flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-[min(92dvh,100dvh)] sm:rounded-t-3xl lg:inset-y-0 lg:left-auto lg:right-0 lg:top-16 lg:h-auto lg:max-h-none lg:w-[400px] lg:rounded-none lg:rounded-l-2xl lg:border-l lg:border-gray-200 dark:lg:border-slate-700"
        role="dialog"
        aria-modal="true"
        aria-label="NafaCare AI Health Assistant"
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 lg:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 lg:rounded-tl-2xl">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-white leading-tight">NafaCare AI</p>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
              </div>
              <p className="truncate text-[11px] text-green-100">Health Research Assistant</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
            <div className="min-w-0 flex-1">
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
        <div className="min-h-0 w-full min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4">
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

        {/* Input bar. min-w-0 keeps the send button on screen while the text grows. */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition dark:border-slate-600 dark:bg-slate-800 dark:focus-within:border-green-500 dark:focus-within:ring-green-900/40">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a health question…"
              rows={1}
              enterKeyHint="send"
              disabled={loading}
              className="min-w-0 flex-1 resize-none bg-transparent text-base leading-5 text-slate-700 placeholder-slate-400 outline-none disabled:opacity-50 md:text-[13px] dark:text-slate-200 dark:placeholder-slate-500"
              style={{ maxHeight: '100px' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
          <p className="mt-1.5 hidden text-center text-[10px] text-slate-400 lg:block dark:text-slate-500">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  )
}
