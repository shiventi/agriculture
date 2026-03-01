'use client'

import { Wheat, Star } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

function getRingColor(score) {
  if (score > 0.7) return '#588157'
  if (score >= 0.4) return '#d4a843'
  return '#c0392b'
}

function Stars({ score }) {
  const s = score ?? 0
  const filled = Math.round(s * 5)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= filled ? 'fill-[#d4a843] text-[#d4a843]' : 'fill-primary/20 text-primary/20'}`}
          aria-hidden
        />
      ))}
    </div>
  )
}

export default function YieldCard({
  farm_id,
  crop,
  region,
  farm_size_ha,
  is_small,
  yield_score,
}) {
  const score = yield_score ?? 0
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const offset = circumference - score * circumference
  const ringColor = getRingColor(score)

  return (
    <Card className="yield-card h-[220px] overflow-hidden rounded-2xl border border-border bg-card">
      <CardHeader className="space-y-1 p-3 pb-0">
        <div className="flex items-center gap-2">
          <Wheat className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Yield Forecast
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-bold text-foreground">{farm_id ?? '—'}</span>
          {crop != null && (
            <span className="text-xs text-muted-foreground">{crop}</span>
          )}
          {region != null && (
            <Badge variant="outline" className="rounded-full border-border text-[10px] text-muted-foreground">
              {region}
            </Badge>
          )}
          {is_small && (
            <Badge className="small-farm-badge rounded-full border border-primary/30 bg-primary/20 text-[10px] text-primary">
              Small Farm
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-3 pt-2">
        <div className="relative flex items-center justify-center">
          <svg width="80" height="80" className="-rotate-90 shrink-0" aria-hidden>
            <circle
              cx="40"
              cy="40"
              r={radius}
              strokeWidth="7"
              fill="none"
              className="stroke-border"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              strokeWidth="7"
              fill="none"
              stroke={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <span
            className="absolute text-[20px] font-bold tabular-nums"
            style={{ color: ringColor }}
          >
            {(score * 100).toFixed(0)}%
          </span>
        </div>
        <Progress
          value={score * 100}
          className="mt-2 h-1.5 w-full max-w-[140px] [&>div]:bg-primary"
        />
        <div className="mt-1.5">
          <Stars score={score} />
        </div>
      </CardContent>
    </Card>
  )
}
