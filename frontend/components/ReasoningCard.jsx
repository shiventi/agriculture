'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function ReasoningCard({ reasoning, animationDelay = 0 }) {
  const text = reasoning ?? '—'
  const isLong = text.length > 200

  return (
    <Card
      className="reasoning-card h-[160px] overflow-hidden rounded-2xl border border-border border-l-4 border-l-[#d4a843] bg-card"
      style={{
        animation: 'reasoning-fade-in-up 0.6s ease-out forwards',
        animationDelay: `${animationDelay}ms`,
        opacity: 0,
      }}
    >
      <CardHeader className="space-y-0 p-3 pb-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#d4a843]" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            AI Reasoning
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {isLong ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="line-clamp-4 cursor-help text-xs leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap p-3 text-xs" sideOffset={8}>
                {text}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
