'use client'

import { AlertTriangle, Thermometer, CloudRain } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPercent } from '@/lib/format'

function getRiskLevel(score) {
  if (score < 0.4) return { label: 'Low', variant: 'outline', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-[#588157]/20 dark:text-[#76a874]' }
  if (score <= 0.7) return { label: 'Moderate', variant: 'default', className: 'border-0 bg-amber-50 text-amber-700 dark:bg-[#d4a843]/20 dark:text-[#d4a843]' }
  return { label: 'High risk', variant: 'default', className: 'border-0 bg-red-50 text-red-700 dark:bg-[#c0392b]/20 dark:text-[#e07060]' }
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
  const gaugeColor = score < 0.4 ? '#76a874' : score <= 0.7 ? '#d4a843' : '#c0392b'

  return (
    <Card className="h-[200px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition-shadow duration-200 hover:shadow-lg hover:shadow-black/20 dark:border-[#588157]/30 dark:bg-[#2d4433]">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-4 pb-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-[#f0f4ee]">Climate risk</CardTitle>
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
                className="stroke-zinc-200 dark:stroke-[#588157]/25"
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
        <Separator className="bg-zinc-200 dark:bg-[#588157]/25" />
        <div className="flex items-center gap-4 text-[12px] text-zinc-700 dark:text-[#a8bfa8]">
          <span className="flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-[#a8bfa8]" aria-hidden />
            {temperature_c != null ? `${temperature_c}°C` : '—'}
          </span>
          <Separator orientation="vertical" className="h-4 bg-zinc-200 dark:bg-[#588157]/25" />
          <span className="flex items-center gap-1">
            <CloudRain className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-[#a8bfa8]" aria-hidden />
            {precipitation_mm != null ? `${precipitation_mm} mm` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
