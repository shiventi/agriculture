'use client'

import { CloudRain } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

function getRiskStyle(score) {
  if (score < 0.4)
    return {
      label: 'LOW',
      fill: '#588157',
      badgeClass: 'risk-badge-low border border-primary/30 bg-primary/20 text-primary',
    }
  if (score <= 0.7)
    return {
      label: 'MODERATE',
      fill: '#d4a843',
      badgeClass: 'risk-badge-moderate border border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-400',
    }
  return {
    label: 'HIGH',
    fill: '#c0392b',
    badgeClass: 'risk-badge-high border border-red-500/30 bg-red-500/20 text-red-600 dark:text-red-400',
  }
}

export default function ClimateRiskCard({
  climate_risk_score,
  temperature_c,
  precipitation_mm,
}) {
  const score = climate_risk_score ?? 0
  const style = getRiskStyle(score)
  const angle = score * 180
  const angleRad = (angle * Math.PI) / 180
  const cx = 55
  const cy = 48
  const r = 48
  const needleLength = 36
  const needleX = cx + needleLength * Math.cos(angleRad)
  const needleY = cy - needleLength * Math.sin(angleRad)
  const arcLength = Math.PI * r
  const fillOffset = arcLength - score * arcLength

  const droughtRisk = precipitation_mm != null && precipitation_mm < 10
  const heatStress = temperature_c != null && temperature_c > 35

  return (
    <Card className="climate-card h-[220px] overflow-hidden rounded-2xl border border-border bg-card">
      <CardHeader className="space-y-0 p-3 pb-0">
        <div className="flex items-center gap-2">
          <CloudRain className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Climate Risk
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-2">
        <div className="flex flex-col items-center">
          <svg width="110" height="58" viewBox="0 0 110 58" className="shrink-0" aria-hidden>
            <path
              d={`M 10 48 A 48 48 0 0 1 100 48`}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-border"
            />
            <path
              d={`M 10 48 A 48 48 0 0 1 100 48`}
              fill="none"
              stroke={style.fill}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={fillOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <line
              x1={cx}
              y1={cy}
              x2={needleX}
              y2={needleY}
              stroke={style.fill}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <Badge variant="outline" className={`mt-1 rounded-full border text-[10px] font-medium ${style.badgeClass}`}>
            {style.label}
          </Badge>
        </div>
        <Separator className="bg-border" />
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span aria-hidden>🌡</span>
            <span>{temperature_c != null ? `${temperature_c}°C avg temperature` : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden>💧</span>
            <span>{precipitation_mm != null ? `${precipitation_mm}mm precipitation` : '—'}</span>
          </div>
        </div>
        {(droughtRisk || heatStress) && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {droughtRisk && (
              <Badge className="rounded-full border border-amber-500/50 bg-amber-500/20 text-[10px] text-amber-700 dark:text-[#d4a843]">
                ⚠ Drought Risk
              </Badge>
            )}
            {heatStress && (
              <Badge className="rounded-full border border-red-500/50 bg-red-500/20 text-[10px] text-red-700 dark:text-[#e07060]">
                ⚠ Heat Stress
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
