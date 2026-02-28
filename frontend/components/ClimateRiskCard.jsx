'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPercent } from '@/lib/format'

function AlertTriangleIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ThermometerIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  )
}

function CloudRainIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    </svg>
  )
}

function getRiskLevel(score) {
  if (score < 0.4) return { label: 'LOW', variant: 'outline', className: 'border-emerald-600 text-emerald-400' }
  if (score <= 0.7) return { label: 'MODERATE', variant: 'default', className: 'bg-amber-600 text-white border-0' }
  return { label: 'HIGH RISK', variant: 'default', className: 'bg-red-600 text-white border-0' }
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
    <Card className="h-[200px] overflow-hidden border-zinc-800 bg-zinc-900 transition-shadow hover:shadow-lg hover:shadow-black/20">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-4 pb-0">
        <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
        <CardTitle className="text-sm font-semibold text-zinc-100">Climate Risk</CardTitle>
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
                className="text-zinc-700"
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
        <Separator className="bg-zinc-700" />
        <div className="flex items-center gap-4 text-[12px] text-zinc-400">
          <span className="flex items-center gap-1">
            <ThermometerIcon className="h-3.5 w-3.5" />
            {temperature_c != null ? `${temperature_c}°C` : '—'}
          </span>
          <Separator orientation="vertical" className="h-4 bg-zinc-700" />
          <span className="flex items-center gap-1">
            <CloudRainIcon className="h-3.5 w-3.5" />
            {precipitation_mm != null ? `${precipitation_mm} mm` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
