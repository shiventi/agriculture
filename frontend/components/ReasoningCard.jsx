'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReasoningCard({ farm_id, reasoning }) {
  return (
    <Card className="h-[160px] overflow-hidden border-l-4 border-l-amber-500 border-zinc-800 bg-zinc-900 transition-shadow hover:shadow-lg hover:shadow-black/20">
      <CardHeader className="space-y-0 p-4 pb-0">
        <CardTitle className="text-sm font-semibold text-zinc-100">
          AI Reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="line-clamp-4 text-[13px] leading-relaxed text-zinc-400">
          {reasoning ?? '—'}
        </p>
      </CardContent>
    </Card>
  )
}
