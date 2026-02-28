'use client'

export default function ClimateRiskCard({ farm_id, climate_risk_score }) {
  const score = climate_risk_score ?? 0
  const pct = Math.round(score * 100)
  return (
    <div className="rounded-2xl bg-cream p-4 shadow-lg shadow-deep-green/15">
      <h4 className="text-sm font-semibold text-deep-green">Climate Risk</h4>
      <p className="mt-1 text-lg font-bold text-deep-green">{pct}%</p>
    </div>
  )
}
