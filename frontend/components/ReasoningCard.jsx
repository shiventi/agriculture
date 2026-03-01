'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReasoningCard({ farm_id, reasoning }) {
  return (
    <Card className="h-[160px] overflow-hidden rounded-2xl border border-zinc-200 border-l-4 border-l-amber-400 bg-zinc-50 transition-shadow hover:bg-zinc-100 hover:shadow-lg hover:shadow-black/20 dark:border-zinc-800 dark:border-l-amber-500 dark:bg-zinc-900 dark:hover:bg-zinc-800">
      <CardHeader className="space-y-0 p-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          AI reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="line-clamp-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          {reasoning ?? '—'}
        </p>
      </CardContent>
    </Card>
  )
}
