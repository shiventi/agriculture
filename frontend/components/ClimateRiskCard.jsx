'use client'

import { formatPercent } from '@/lib/format'

export default function ClimateRiskCard({ farm_id, climate_risk_score }) {
  const score = climate_risk_score ?? 0
  return (
    <div className="card-hover flex h-full flex-col rounded-2xl bg-cream p-4 shadow-lg shadow-deep-green/15">
      <h4 className="text-sm font-semibold text-deep-green">Climate Risk</h4>
      <p className="mt-1 flex-1 text-lg font-bold text-deep-green">{formatPercent(score)}</p>
    </div>
  )
}
