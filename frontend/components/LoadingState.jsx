'use client'

import { useState, useEffect } from 'react'

const MESSAGES = [
  'Fetching weather & soil data...',
  'Running PyTorch yield model...',
  'Applying fairness constraints...',
  'Generating AI explanations...',
  'Building your dashboard...',
]

function WheatStalkSvg() {
  return (
    <svg
      className="h-36 w-16"
      viewBox="0 0 64 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="loading-stalk" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1a3a2a" />
          <stop offset="100%" stopColor="#2d8a6e" />
        </linearGradient>
      </defs>
      <path
        d="M32 144 V8"
        stroke="url(#loading-stalk)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        className="loading-stalk-draw"
      />
      <ellipse cx="32" cy="6" rx="10" ry="6" fill="#d4a843" className="loading-stalk-head" />
    </svg>
  )
}

function Particles() {
  const count = 12
  return (
    <div className="loading-particles" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="loading-particle"
          style={{
            left: `${5 + (i * 8) % 90}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${8 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-deep-green/95 text-cream"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Particles />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <WheatStalkSvg />
        <p className="min-h-[1.5em] text-center text-lg font-medium transition-opacity duration-300">
          {MESSAGES[messageIndex]}
        </p>
        <div className="w-72 overflow-hidden rounded-full bg-cream/20">
          <div className="loading-progress-bar h-2 rounded-full bg-gold" />
        </div>
      </div>
    </div>
  )
}
