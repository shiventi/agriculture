'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import YieldCard from '@/components/YieldCard'
import ClimateRiskCard from '@/components/ClimateRiskCard'
import SubsidyCard from '@/components/SubsidyCard'
import ReasoningCard from '@/components/ReasoningCard'
import { formatUSD, formatPercent } from '@/lib/format'

const ACCENTS = [
  { border: 'border-t-primary', dot: 'bg-primary', glow: 'hsl(var(--primary) / 0.12)', shadow: 'hsl(var(--primary) / 0.25)' },
  { border: 'border-t-primary', dot: 'bg-primary', glow: 'hsl(var(--primary) / 0.12)', shadow: 'hsl(var(--primary) / 0.25)' },
  { border: 'border-t-amber-500', dot: 'bg-amber-500', glow: 'rgba(245, 158, 11, 0.08)', shadow: 'rgba(245, 158, 11, 0.18)' },
  { border: 'border-t-amber-500', dot: 'bg-amber-500', glow: 'rgba(245, 158, 11, 0.08)', shadow: 'rgba(245, 158, 11, 0.18)' },
  { border: 'border-t-blue-500', dot: 'bg-blue-500', glow: 'rgba(59, 130, 246, 0.08)', shadow: 'rgba(59, 130, 246, 0.18)' },
  { border: 'border-t-blue-500', dot: 'bg-blue-500', glow: 'rgba(59, 130, 246, 0.08)', shadow: 'rgba(59, 130, 246, 0.18)' },
  { border: 'border-t-rose-500', dot: 'bg-rose-500', glow: 'rgba(244, 63, 94, 0.08)', shadow: 'rgba(244, 63, 94, 0.18)' },
  { border: 'border-t-rose-500', dot: 'bg-rose-500', glow: 'rgba(244, 63, 94, 0.08)', shadow: 'rgba(244, 63, 94, 0.18)' },
]
const FALLBACK_ACCENT = { border: 'border-t-primary', dot: 'bg-primary', glow: 'hsl(var(--primary) / 0.12)', shadow: 'hsl(var(--primary) / 0.25)' }

function getAccent(index) {
  return ACCENTS[index] ?? FALLBACK_ACCENT
}

export default function FarmGrid({ results, isLoading, onBack }) {
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
      <Card className="farm-card rounded-2xl border-zinc-200 bg-white shadow-sm dark:border-[hsl(84,8%,30%)] dark:bg-[#323b22] transition-colors duration-200">
        <CardContent className="py-12 text-center text-zinc-500 dark:text-[hsl(84,8%,68%)]">
          {isLoading ? 'Loading...' : 'No farm data to display.'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="farm-card rounded-2xl border-zinc-200 bg-white shadow-sm dark:border-[hsl(84,8%,30%)] dark:bg-[#323b22] sm:mb-2 transition-colors duration-200">
        <CardContent className="flex flex-row flex-wrap items-center justify-center gap-3 py-4 sm:justify-start sm:gap-4">
          <span className="text-sm text-zinc-500 dark:text-[hsl(84,8%,68%)]">
            <span className="font-semibold text-emerald-600 dark:text-[#00ff87]">{summary.totalFarms}</span> farms
          </span>
          <Separator orientation="vertical" className="hidden h-5 bg-zinc-300 dark:bg-[hsl(84,8%,30%)] sm:block" />
          <span className="text-sm text-zinc-500 dark:text-[hsl(84,8%,68%)]">
            <span className="font-semibold text-emerald-600 dark:text-[#00ff87]">{formatUSD(summary.totalBudget)}</span> total budget
          </span>
          <Separator orientation="vertical" className="hidden h-5 bg-zinc-300 dark:bg-[hsl(84,8%,30%)] sm:block" />
          <span className="text-sm text-zinc-500 dark:text-[hsl(84,8%,68%)]">
            <span className="font-semibold text-emerald-600 dark:text-[#00ff87]">{formatPercent(summary.avgYield)}</span> avg yield
          </span>
          <Separator orientation="vertical" className="hidden h-5 bg-zinc-300 dark:bg-[hsl(84,8%,30%)] sm:block" />
          <span className="text-sm text-zinc-500 dark:text-[hsl(84,8%,68%)]">
            <span className="font-semibold text-zinc-900 dark:text-[hsl(0,0%,98%)]">{summary.smallFarmShare}%</span> small farm share
          </span>
          <Badge className="ml-auto w-full justify-center rounded-full border-emerald-200 bg-emerald-50 py-1.5 text-emerald-700 dark:border-[hsl(82,50%,32%)]/30 dark:bg-[hsl(82,50%,32%)]/20 dark:text-[hsl(82,50%,60%)] sm:w-auto sm:justify-start">
            <Check className="mr-1 h-3.5 w-3.5" aria-hidden />
            Fairness active
          </Badge>
        </CardContent>
      </Card>

      <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {farms.map((farm, index) => {
          const accent = getAccent(index)
          const farmId = farm.farm_id ?? farm.id
          return (
            <Card
              key={farmId}
              className={`farm-card relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-300 dark:border-[hsl(84,8%,30%)] dark:bg-[#323b22] dark:hover:shadow-[0_0_20px_rgba(0,255,135,0.08)] sm:rounded-3xl ${accent.border} border-t-4`}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 10px 40px -10px ${accent.shadow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl"
                style={{
                  background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent.glow}, transparent 70%)`,
                }}
              />
              <span
                className="pointer-events-none absolute right-3 top-2 select-none text-5xl font-black text-zinc-900/5 sm:text-6xl dark:text-white/5"
                aria-hidden
              >
                {farmId}
              </span>
              <div className="relative mb-4 flex flex-wrap items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} aria-hidden />
                <span className="font-bold text-zinc-900 dark:text-[hsl(0,0%,98%)]">{farmId}</span>
                <span className="text-zinc-500 dark:text-[hsl(84,8%,68%)]">{farm.crop ?? '—'}</span>
                {farm.region && (
                  <Badge variant="outline" className="rounded-full border-zinc-300 text-[10px] text-zinc-500 dark:border-[hsl(84,8%,30%)] dark:text-[hsl(84,8%,68%)]">
                    {farm.region}
                  </Badge>
                )}
              </div>
              <div className="relative flex flex-col gap-3 sm:gap-4">
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
            </Card>
          )
        })}
      </div>
    </div>
  )
}
