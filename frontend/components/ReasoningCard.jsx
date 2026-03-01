'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ReasoningCard({ reasoning, animationDelay = 0 }) {
  return (
    <Card
      className="reasoning-card h-[160px] overflow-hidden rounded-2xl border-l-4 border-l-[#d4a843] dark:border-[#588157]/30 dark:bg-[#2d4433] border-[#d4e0cc] bg-[#f0f4ec]"
      style={{
        animation: 'reasoning-fade-in-up 0.6s ease-out forwards',
        animationDelay: `${animationDelay}ms`,
        opacity: 0,
      }}
    >
      <CardHeader className="space-y-0 p-3 pb-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#d4a843]" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-widest dark:text-[#a8bfa8] text-[#5a7a5a]">
            AI Reasoning
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="line-clamp-4 text-xs leading-relaxed dark:text-[#a8bfa8] text-[#5a7a5a]">
          {reasoning ?? '—'}
        </p>
      </CardContent>
    </Card>
  )
}
