'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import YieldCard from '@/components/YieldCard'
import ClimateRiskCard from '@/components/ClimateRiskCard'
import SubsidyCard from '@/components/SubsidyCard'
import ReasoningCard from '@/components/ReasoningCard'
import { formatUSD, formatPercent } from '@/lib/format'

export default function FarmGrid({ results, isLoading }) {
  const farms = results?.farms ?? []

  const summary = useMemo(() => {
    if (!farms.length) return { totalFarms: 0, totalBudget: 0, avgYield: 0, smallFarmShare: 0 }
    const totalBudget = farms.reduce((sum, f) => sum + (f.subsidy_amount ?? 0), 0)
    const avgYield = farms.reduce((sum, f) => sum + (f.yield_score ?? 0), 0) / farms.length
    const smallCount = farms.filter((f) => f.is_small).length
    const smallFarmShare = farms.length ? (smallCount / farms.length) * 100 : 0
    return {
      totalFarms: farms.length,
      totalBudget,
      avgYield,
      smallFarmShare: Math.round(smallFarmShare * 10) / 10,
    }
  }, [farms])

  if (farms.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="py-12 text-center text-zinc-500">
          {isLoading ? 'Loading...' : 'No farm data to display.'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card className="mb-6 border-zinc-800 bg-zinc-900">
        <CardContent className="flex flex-row flex-wrap items-center gap-4 py-4">
          <span className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-100">{summary.totalFarms}</span> Farms
          </span>
          <Separator orientation="vertical" className="h-5 bg-zinc-700" />
          <span className="text-sm text-zinc-400">
            <span className="font-semibold text-[#00ff87]">{formatUSD(summary.totalBudget)}</span> total budget
          </span>
          <Separator orientation="vertical" className="h-5 bg-zinc-700" />
          <span className="text-sm text-zinc-400">
            <span className="font-semibold text-[#00ff87]">{formatPercent(summary.avgYield)}</span> avg yield
          </span>
          <Separator orientation="vertical" className="h-5 bg-zinc-700" />
          <span className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-100">{summary.smallFarmShare}%</span> small farm share
          </span>
          <Badge className="ml-auto border-emerald-700 bg-emerald-950/50 text-emerald-400">
            Fairness Active ✓
          </Badge>
        </CardContent>
      </Card>

      {/* Grid: one column per farm, rows align across farms */}
      <div
        className="grid w-full gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {farms.map((farm) => (
          <div
            key={farm.farm_id ?? farm.id}
            className="flex flex-col gap-4"
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
  )
}
