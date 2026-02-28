'use client'

import { formatPercent } from '@/lib/format'

function getRiskColor(score) {
  if (score < 0.4) return { stroke: '#2d8a6e', label: 'LOW RISK' }
  if (score <= 0.7) return { stroke: '#d97706', label: 'MODERATE' }
  return { stroke: '#c0392b', label: 'HIGH RISK' }
}

function ThermometerIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  )
}

function RaindropIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

export default function ClimateRiskCard({
  farm_id,
  climate_risk_score,
  temperature_c,
  precipitation_mm,
}) {
  const score = climate_risk_score ?? 0
  const { stroke, label } = getRiskColor(score)
  const angleDeg = 180 - score * 180
  const angleRad = (angleDeg * Math.PI) / 180
  const needleLength = 35
  const cx = 50
  const cy = 50
  const needleX = cx + needleLength * Math.cos(angleRad)
  const needleY = cy - needleLength * Math.sin(angleRad)
  const showWarnings = score > 0.5

  return (
    <div className="dashboard-card flex flex-col bg-[#1e2d26] text-cream">
      <p className="card-header-label text-cream/80">Climate Risk</p>
      <div className="mt-1 flex min-h-0 flex-1 items-center gap-2">
        <div className="relative flex-shrink-0" style={{ width: 100, height: 52 }}>
          <svg viewBox="0 0 100 60" className="h-[52px] w-[100px]" aria-hidden>
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={stroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={125}
              strokeDashoffset={125 - (score * 125)}
              className="transition-all duration-200"
            />
            <line
              x1={cx}
              y1={cy}
              x2={needleX}
              y2={needleY}
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cream/70">
            {label}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-cream/80">
            <span className="flex items-center gap-1">
              <ThermometerIcon className="h-3 w-3" />
              {temperature_c != null ? `${temperature_c}°C` : '—'}
            </span>
            <span className="flex items-center gap-1">
              <RaindropIcon className="h-3 w-3" />
              {precipitation_mm != null ? `${precipitation_mm} mm` : '—'}
            </span>
          </div>
          {showWarnings && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                Drought
              </span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                Flood
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
