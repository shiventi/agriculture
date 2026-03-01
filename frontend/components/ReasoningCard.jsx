'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReasoningCard({ farm_id, reasoning }) {
  return (
    <Card className="h-[160px] overflow-hidden rounded-2xl border border-zinc-200 border-l-4 border-l-amber-400 bg-zinc-50 transition-colors duration-200 transition-shadow hover:bg-zinc-100 hover:shadow-lg hover:shadow-black/20 dark:border-[hsl(84,8%,22%)] dark:border-l-[#d4a843] dark:bg-[#1F211C] dark:hover:bg-[#243010]">
      <CardHeader className="space-y-0 p-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-[hsl(0,0%,98%)]">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          AI reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="line-clamp-4 text-[13px] leading-relaxed text-zinc-700 dark:text-[hsl(84,8%,58%)]">
          {reasoning ?? '—'}
        </p>
      </CardContent>
    </Card>
  )
}
