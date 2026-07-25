import { useState, useEffect } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

const navLinks = [
  { label: 'Home',                href: '#home'          },
  { label: 'Features',            href: '#features'      },
  { label: 'How It Works',        href: '#how-it-works'  },
  { label: 'Health Professionals', href: '#professionals' },
  { label: 'Health Tips',         href: '#health-tips'   },
]

export default function Navbar({ onSignUpProfessional, onOpenDoctors }) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [activeHash, setActiveHash] = useState('#home')
  const [dark, setDark] = useDarkMode()

  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.href.slice(1))

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHash(`#${entry.target.id}`)
        })
      },
      { threshold: 0.25 },
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function handleLinkClick() {
    setMenuOpen(false)
  }

  function handleSignUp(e) {
    e.preventDefault()
    setMenuOpen(false)
    onSignUpProfessional?.()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* ── Logo ── */}
        <a href="#home" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-8 w-8 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.35-9.5-8.5A5.5 5.5 0 0112 4a5.5 5.5 0 019.5 8.5C19 16.65 12 21 12 21z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v6m-3-3h6" />
          </svg>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">
            Nafa<span className="text-green-600">Care</span>
          </span>
        </a>

        {/* ── Desktop nav links ── */}
        <ul className="hidden items-center gap-8 text-[15px] font-medium text-slate-600 dark:text-slate-300 lg:flex">
          {navLinks.map((link) =>
            link.href === '#professionals' ? (
              <li key={link.href}>
                <button
                  onClick={() => onOpenDoctors?.()}
                  className={`transition hover:text-green-600 ${activeHash === link.href ? 'text-green-600' : ''}`}
                >
                  {link.label}
                </button>
              </li>
            ) : (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`transition hover:text-green-600 ${activeHash === link.href ? 'text-green-600' : ''}`}
                >
                  {link.label}
                </a>
              </li>
            )
          )}
        </ul>

        {/* ── Right side controls ── */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Theme toggle */}
          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {dark ? (
              /* Sun icon */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06L5.404 4.343a.75.75 0 0 0-1.06 1.06l1.06 1.061Z" />
              </svg>
            ) : (
              /* Moon icon */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Join as a Provider */}
          <button
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.137a6.979 6.979 0 0 0 3.384.86 6.979 6.979 0 0 0 3.384-.86.75.75 0 0 0 .57-1.137 6.978 6.978 0 0 0-7.908 0ZM12.75 7.75a.75.75 0 0 0 0 1.5h2.25V11.5a.75.75 0 0 0 1.5 0V9.25h2.25a.75.75 0 0 0 0-1.5h-2.25V5.5a.75.75 0 0 0-1.5 0v2.25h-2.25Z" />
            </svg>
            Join as a Provider
          </button>
        </div>

        {/* ── Mobile: theme toggle + hamburger ── */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06L5.404 4.343a.75.75 0 0 0-1.06 1.06l1.06 1.061Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            className="p-1"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-7 w-7 dark:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-7 w-7 dark:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
          <ul className="flex flex-col gap-1 text-[15px] font-medium text-slate-600 dark:text-slate-300">
            {navLinks.map((link) =>
              link.href === '#professionals' ? (
                <li key={link.href}>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenDoctors?.() }}
                    className={`flex w-full items-center rounded-xl px-3 py-2.5 transition hover:bg-green-50 hover:text-green-700 dark:hover:bg-slate-800 ${
                      activeHash === link.href ? 'bg-green-50 text-green-700 dark:bg-slate-800' : ''
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ) : (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center rounded-xl px-3 py-2.5 transition hover:bg-green-50 hover:text-green-700 dark:hover:bg-slate-800 ${
                      activeHash === link.href ? 'bg-green-50 text-green-700 dark:bg-slate-800' : ''
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              )
            )}

            {/* Mobile CTA — live but no-op */}
            <li className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={(e) => e.preventDefault()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-[0.97]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.137a6.979 6.979 0 0 0 3.384.86 6.979 6.979 0 0 0 3.384-.86.75.75 0 0 0 .57-1.137 6.978 6.978 0 0 0-7.908 0ZM12.75 7.75a.75.75 0 0 0 0 1.5h2.25V11.5a.75.75 0 0 0 1.5 0V9.25h2.25a.75.75 0 0 0 0-1.5h-2.25V5.5a.75.75 0 0 0-1.5 0v2.25h-2.25Z" />
                </svg>
                Join as a Provider
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
