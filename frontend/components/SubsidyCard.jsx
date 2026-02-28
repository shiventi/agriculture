'use client'

import { formatUSD } from '@/lib/format'

export default function SubsidyCard({
  farm_id,
  subsidy_amount,
  subsidy_eligible,
  is_small,
  gini_coefficient,
  small_farm_share_pct,
}) {
  const amount = subsidy_amount ?? 0
  const maxAmount = 2000
  const pct = maxAmount > 0 ? Math.min(100, (amount / maxAmount) * 100) : 0

  return (
    <div className="dashboard-card flex flex-col bg-[#1a3a2a] text-cream">
      <p className="card-header-label text-cream/70">Subsidy</p>
      <p className="mt-0.5 text-[28px] font-bold leading-tight text-gold">
        {formatUSD(amount)}
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-cream/10">
        <div
          className="h-full rounded-full bg-teal transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      {is_small && (
        <div className="mt-2 flex items-center gap-1.5 rounded bg-teal/20 px-2 py-1 text-[11px] font-medium text-teal">
          <span aria-hidden>✓</span>
          Equity constraints applied
        </div>
      )}
      <div className="mt-2 flex gap-3">
        <div className="rounded bg-cream/5 px-2 py-1">
          <p className="text-[10px] text-cream/60">Gini</p>
          <p className="text-[12px] font-semibold text-cream">
            {gini_coefficient != null ? gini_coefficient.toFixed(2) : '—'}
          </p>
        </div>
        <div className="rounded bg-cream/5 px-2 py-1">
          <p className="text-[10px] text-cream/60">Small share</p>
          <p className="text-[12px] font-semibold text-cream">
            {small_farm_share_pct != null ? `${small_farm_share_pct}%` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
