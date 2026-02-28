'use client'

import { formatPercent } from '@/lib/format'

function getScoreColorClass(score) {
  if (score < 0.4) return 'yield-poor'
  if (score <= 0.7) return 'yield-amber'
  return 'yield-good'
}

function StarRow({ score, colorClass }) {
  const s = score ?? 0
  const filled = Math.round(s * 5)
  return (
    <div className={`flex items-center justify-center gap-0.5 ${colorClass}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill={i <= filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
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
  const s = yield_score ?? 0
  const colorClass = getScoreColorClass(s)
  const r = 32
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - s)

  return (
    <article
      className="dashboard-card flex flex-col overflow-hidden bg-[#f5f0e8] text-deep-green"
      style={{ borderColor: 'rgba(26,58,42,0.08)' }}
    >
      <p className="card-header-label text-deep-green/70">Expected Yield</p>
      <div className="mt-1 flex min-h-0 flex-1 items-center gap-3">
        <div className="relative flex-shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden>
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-deep-green/15"
            />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-[stroke] duration-200 ${colorClass}`}
            />
          </svg>
          <span
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold transition-colors duration-200 ${colorClass}`}
            aria-label={`Yield ${formatPercent(s)}`}
          >
            {formatPercent(s)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-bold leading-tight">{farm_id ?? '—'}</h3>
          <p className="card-muted mt-0.5 text-xs text-deep-green/60">
            {[crop, region].filter(Boolean).join(' · ') || '—'}
          </p>
          {farm_size_ha != null && (
            <p className="card-muted mt-0.5 text-deep-green/50">{farm_size_ha} ha</p>
          )}
          {is_small && (
            <span className="mt-1.5 inline-block rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal">
              Small Farm
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-0.5 text-deep-green/25">
        <StarRow score={s} colorClass={colorClass} />
      </div>
    </article>
  )
}
