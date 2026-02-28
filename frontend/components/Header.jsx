'use client'

import { useState, useEffect } from 'react'

function SunIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

const THEME_KEY = 'agriequity-theme'

export default function Header() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
    const initial = stored === 'light' ? 'light' : 'dark'
    setTheme(initial)
    if (initial === 'light') document.documentElement.classList.add('theme-light')
    else document.documentElement.classList.remove('theme-light')
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, next)
      if (next === 'light') document.documentElement.classList.add('theme-light')
      else document.documentElement.classList.remove('theme-light')
    }
  }

  return (
    <header className="header-bar">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-gold tracking-tight">
            AgriEquity AI
            <span className="live-pulse-dot" aria-hidden title="Live data" />
          </h1>
          <p className="header-subtitle">
            AI-Powered Farm Yield · Climate Risk · Fair Subsidies
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  )
}
