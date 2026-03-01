'use client'

import { AlertTriangle, Thermometer, CloudRain } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPercent } from '@/lib/format'

function getRiskLevel(score) {
  if (score < 0.4) return { label: 'Low', variant: 'outline', className: 'risk-badge risk-badge-low border-primary text-primary' }
  if (score <= 0.7) return { label: 'Moderate', variant: 'default', className: 'risk-badge risk-badge-moderate bg-amber-600 text-white border-0' }
  return { label: 'High risk', variant: 'default', className: 'risk-badge risk-badge-high bg-red-600 text-white border-0' }
}

export default function ClimateRiskCard({
  farm_id,
  climate_risk_score,
  temperature_c,
  precipitation_mm,
}) {
  const score = climate_risk_score ?? 0
  const level = getRiskLevel(score)
  const angleDeg = 180 - score * 180
  const angleRad = (angleDeg * Math.PI) / 180
  const needleLength = 32
  const cx = 50
  const cy = 50
  const needleX = cx + needleLength * Math.cos(angleRad)
  const needleY = cy - needleLength * Math.sin(angleRad)
  const gaugeColor = score < 0.4 ? '#14b8a6' : score <= 0.7 ? '#f59e0b' : '#ef4444'

  return (
    <Card className="climate-card h-[200px] overflow-hidden rounded-2xl border-border bg-card transition-shadow hover:shadow-lg hover:shadow-black/20">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-4 pb-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <CardTitle className="text-sm font-semibold text-foreground">Climate risk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0" style={{ width: 80, height: 44 }}>
            <svg viewBox="0 0 100 60" className="h-11 w-20" aria-hidden>
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                className="text-border"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={125}
                strokeDashoffset={125 - score * 125}
                className="transition-all duration-200"
              />
              <line
                x1={cx}
                y1={cy}
                x2={needleX}
                y2={needleY}
                stroke={gaugeColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <Badge className={level.className}>{level.label}</Badge>
        </div>
        <Separator className="bg-border" />
        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {temperature_c != null ? `${temperature_c}°C` : '—'}
          </span>
          <Separator orientation="vertical" className="h-4 bg-border" />
          <span className="flex items-center gap-1">
            <CloudRain className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {precipitation_mm != null ? `${precipitation_mm} mm` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
