'use client'

import { useMemo } from 'react'
import YieldCard from '@/components/YieldCard'
import ClimateRiskCard from '@/components/ClimateRiskCard'
import SubsidyCard from '@/components/SubsidyCard'
import ReasoningCard from '@/components/ReasoningCard'
import { formatUSD, formatPercent } from '@/lib/format'

export default function FarmGrid({ results, isLoading }) {
  const farms = results?.farms ?? []

  const summary = useMemo(() => {
    if (!farms.length) return { totalFarms: 0, totalBudget: 0, avgYield: 0 }
    const totalBudget = farms.reduce((sum, f) => sum + (f.subsidy_amount ?? 0), 0)
    const avgYield = farms.reduce((sum, f) => sum + (f.yield_score ?? 0), 0) / farms.length
    return {
      totalFarms: farms.length,
      totalBudget,
      avgYield,
    }
  }, [farms])

  if (farms.length === 0) {
    return (
      <div className="rounded-2xl bg-cream/5 px-6 py-12 text-center text-cream/80">
        {isLoading ? 'Loading...' : 'No farm data to display.'}
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Sticky summary bar */}
      <div className="sticky top-[73px] z-40 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-deep-green/90 px-4 py-3 backdrop-blur-sm">
        <span className="text-[13px] text-cream/90">
          <strong className="text-cream">{summary.totalFarms}</strong> farms
        </span>
        <span className="text-[13px] text-cream/90">
          <strong className="text-gold">{formatUSD(summary.totalBudget)}</strong> total budget
        </span>
        <span className="text-[13px] text-cream/90">
          <strong className="text-teal">{formatPercent(summary.avgYield)}</strong> avg yield
        </span>
        <span className="ml-auto rounded-full bg-teal/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal">
          Fairness Active ✓
        </span>
      </div>

      {/* Horizontal scrollable row of farm panels */}
      <div className="overflow-x-auto overflow-y-visible pb-4 scroll-smooth">
        <div className="flex gap-6" style={{ width: 'max-content' }}>
          {farms.map((farm, index) => (
            <div
              key={farm.farm_id ?? farm.id}
              className="farm-panel flex w-[300px] flex-shrink-0 flex-col gap-3"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <YieldCard
                farm_id={farm.farm_id}
                crop={farm.crop}
                region={farm.region}
                farm_size_ha={farm.farm_size_ha}
                is_small={farm.is_small}
                yield_score={farm.yield_score}
              />
              <ClimateRiskCard
                farm_id={farm.farm_id}
                climate_risk_score={farm.climate_risk_score}
                temperature_c={farm.temperature_c}
                precipitation_mm={farm.precipitation_mm}
              />
              <SubsidyCard
                farm_id={farm.farm_id}
                subsidy_amount={farm.subsidy_amount}
                subsidy_eligible={farm.subsidy_eligible}
                is_small={farm.is_small}
                gini_coefficient={farm.gini_coefficient}
                small_farm_share_pct={farm.small_farm_share_pct}
              />
              <ReasoningCard
                farm_id={farm.farm_id}
                reasoning={farm.reasoning}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
