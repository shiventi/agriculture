'use client'

import { formatPercent } from '@/lib/format'

function WheatIconSmall({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2v28M12 2c-2 4-4 8-4 14 0 3 1 6 4 6s4-3 4-6c0-6-2-10-4-14zm0 0c2 4 4 8 4 14 0 3-1 6-4 6S8 19 8 16c0-6 2-10 4-14z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="6" rx="3" ry="2" fill="currentColor" opacity="0.9" />
      <ellipse cx="12" cy="11" rx="3.5" ry="2.5" fill="currentColor" opacity="0.85" />
      <ellipse cx="12" cy="17" rx="3" ry="2" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function getScoreColorClass(score) {
  if (score < 0.4) return 'yield-poor'
  if (score <= 0.7) return 'yield-amber'
  return 'yield-good'
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
  const r = 44
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - s)

  return (
    <article className="card-hover flex h-full flex-col overflow-hidden rounded-2xl bg-cream shadow-lg shadow-deep-green/15">
      {/* Gold header bar */}
      <div className="flex items-center gap-2 bg-gold px-4 py-2.5">
        <WheatIconSmall className="h-5 w-4 text-deep-green" />
        <span className="text-sm font-semibold text-deep-green">Expected Yield</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        {/* Farm id, subtitle, size, badge */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-deep-green">{farm_id ?? '—'}</h3>
          <p className="mt-0.5 text-sm text-deep-green/80">
            {[crop, region].filter(Boolean).join(' · ') || '—'}
          </p>
          <p className="mt-1 text-xs text-deep-green/50">
            {farm_size_ha != null ? `${farm_size_ha} ha` : '—'}
          </p>
          {is_small && (
            <span className="mt-2 inline-block rounded-full bg-teal/20 px-2.5 py-0.5 text-xs font-medium text-teal">
              Small Farm
            </span>
          )}
        </div>

        {/* Circular progress ring */}
        <div className="relative mx-auto my-2 flex flex-shrink-0 items-center justify-center">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-deep-green/15"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`yield-ring transition-[stroke-dashoffset] duration-500 ease-out ${colorClass}`}
            />
          </svg>
          <span
            className={`absolute text-2xl font-bold transition-colors duration-300 ${colorClass}`}
            aria-label={`Yield score ${formatPercent(s)}`}
          >
            {formatPercent(s)}
          </span>
        </div>

        {/* Horizontal rating bar: Poor → Excellent */}
        <div className="mt-4">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-deep-green/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
              style={{ width: `${s * 100}%` }}
            />
            <div
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-cream shadow-md transition-all duration-300 ${colorClass}`}
              style={{
                left: `${Math.min(100, s * 100)}%`,
                marginLeft: -6,
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-deep-green/60">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>
    </article>
  )
}
