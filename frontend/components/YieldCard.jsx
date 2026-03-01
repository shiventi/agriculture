'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatPercent } from '@/lib/format'

function getRingColor(score) {
  if (score < 0.4) return '#ef4444'
  if (score <= 0.7) return '#f59e0b'
  return '#14b8a6'
}

export default function YieldCard({
  farm_id,
  crop,
  region,
  farm_size_ha,
  is_small,
  yield_score,
}) {
  const s = yield_score ?? 0
  const r = 32
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - s)
  const ringColor = getRingColor(s)

  return (
    <Card className="yield-card h-[200px] overflow-hidden rounded-2xl border-border bg-card transition-shadow hover:shadow-lg hover:shadow-black/20">
      <CardHeader className="space-y-1 p-4 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {farm_id ?? '—'}
          </CardTitle>
          {region && (
            <Badge variant="outline" className="rounded-full border-border text-[10px] text-muted-foreground">
              {region}
            </Badge>
          )}
          {is_small && (
            <Badge className="rounded-full border-0 bg-primary/20 text-[10px] text-primary">
              Small farm
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{crop ?? '—'}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden>
              <circle
                cx="40"
                cy="40"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-border"
              />
              <circle
                cx="40"
                cy="40"
                r={r}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke] duration-200"
                style={{ stroke: ringColor }}
              />
            </svg>
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: ringColor }}
            >
              {formatPercent(s)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            {farm_size_ha != null && (
              <p className="text-[11px] text-muted-foreground">{farm_size_ha} ha</p>
            )}
          </div>
        </div>
        <Progress value={s * 100} className="h-1.5 rounded-full [&>div]:rounded-full [&>div]:bg-primary" />
      </CardContent>
    </Card>
  )
}
