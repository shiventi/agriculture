'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const MESSAGES = [
  'Fetching weather & soil data...',
  'Running PyTorch yield model...',
  'Applying fairness constraints...',
  'Generating AI explanations...',
  'Building your dashboard...',
]

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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background/95 text-foreground"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Loader2 className="h-16 w-16 animate-spin text-primary sm:h-20 sm:w-20" aria-hidden />
      <p className="min-h-[1.5em] max-w-xs px-4 text-center text-base font-medium transition-opacity duration-300 sm:text-lg">
        {MESSAGES[messageIndex]}
      </p>
      <div className="w-56 overflow-hidden rounded-full bg-muted sm:w-72">
        <div className="h-2 w-full animate-pulse rounded-full bg-primary/40" />
      </div>
    </div>
  )
}
