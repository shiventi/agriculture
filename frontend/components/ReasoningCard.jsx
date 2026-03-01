'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReasoningCard({ farm_id, reasoning }) {
  return (
    <Card className="reasoning-card min-h-[200px] overflow-hidden rounded-2xl border-l-4 border-l-amber-500 border-border bg-card">
      <CardHeader className="space-y-0 p-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          AI reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="line-clamp-6 text-base leading-7 text-muted-foreground">
          {reasoning ?? '—'}
        </p>
      </CardContent>
    </Card>
  )
}
