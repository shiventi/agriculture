'use client'

import { useMemo, useState } from 'react'
import { Check, LayoutGrid, Table2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const [viewMode, setViewMode] = useState('table')

  const summary = useMemo(() => {
    if (!farms.length) return { totalFarms: 0, totalBudget: 0, avgExpectedYield: 0, smallFarmShare: 0 }
    const totalBudget = farms.reduce((sum, f) => sum + (f.subsidy_amount ?? 0), 0)
    const expectedYields = farms.map((f) => f.expected_yield ?? (f.yield_score != null ? f.yield_score * 50000 : 0))
    const avgExpectedYield = expectedYields.length ? expectedYields.reduce((a, b) => a + b, 0) / expectedYields.length : 0
    const smallCount = farms.filter((f) => f.is_small).length
    const smallFarmShare = farms.length ? (smallCount / farms.length) * 100 : 0
    return {
      totalFarms: farms.length,
      totalBudget,
      avgExpectedYield,
      smallFarmShare: Math.round(smallFarmShare * 10) / 10,
    }
  }, [farms])

  if (farms.length === 0) {
    return (
      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          {isLoading ? 'Loading...' : 'No farm data to display.'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="farm-grid-wrapper space-y-4 sm:space-y-6">
      <Card className="summary-bar rounded-2xl border-border bg-card sm:mb-2">
        <CardContent className="summary-bar-content flex flex-row flex-wrap items-center justify-center gap-3 py-4 sm:justify-start sm:gap-4">
          <span className="summary-bar-text text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{summary.totalFarms}</span> farms
          </span>
          <Separator orientation="vertical" className="hidden h-5 bg-border sm:block" />
          <span className="summary-bar-text text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{formatUSD(summary.totalBudget)}</span> total budget
          </span>
          <Separator orientation="vertical" className="hidden h-5 bg-border sm:block" />
          <span className="summary-bar-text text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{formatUSD(summary.avgExpectedYield)}</span> avg expected yield
          </span>
          <Separator orientation="vertical" className="hidden h-5 bg-border sm:block" />
          <span className="summary-bar-text text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{summary.smallFarmShare}%</span> small farm share
          </span>
          <div className="view-toggle-group ml-auto flex w-full items-center justify-end gap-2 sm:w-auto">
            <Button
              type="button"
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="view-toggle-btn h-8 gap-1.5 rounded-full text-xs"
              aria-pressed={viewMode === 'cards'}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
              Cards
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="view-toggle-btn h-8 gap-1.5 rounded-full text-xs"
              aria-pressed={viewMode === 'table'}
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden />
              Table
            </Button>
          </div>
          <Badge className="fairness-active-badge rounded-full border-primary/40 bg-primary/20 py-1.5 text-primary sm:ml-0">
            <Check className="mr-1 h-3.5 w-3.5" aria-hidden />
            Fairness active
          </Badge>
        </CardContent>
      </Card>

      {viewMode === 'table' ? (
        <Card className="farms-table-card overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="farms-table w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="farms-table-header border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Farm</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Size (ha)</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Small</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Expected Yield</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Climate risk</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Subsidy</th>
                  <th className="max-w-[280px] px-4 py-3 text-left font-semibold text-foreground">Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {farms.map((farm, index) => {
                  const farmId = farm.farm_id ?? farm.id
                  const riskScore = farm.climate_risk_score
                  const riskNum = riskScore != null ? (riskScore * 100).toFixed(0) : '—'
                  const expectedYield = farm.expected_yield ?? (farm.yield_score != null ? farm.yield_score * 50000 : null)
                  return (
                    <tr
                      key={farmId}
                      className={`farms-table-row border-b border-border ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">{farmId}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{farm.farm_size_ha ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center">{farm.is_small ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{formatUSD(expectedYield)}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{riskNum}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-primary">{formatUSD(farm.subsidy_amount)}</td>
                      <td className="max-w-[280px] px-4 py-2.5 text-sm leading-relaxed text-muted-foreground" title={farm.reasoning ?? ''}>
                        <span className="line-clamp-3">{farm.reasoning ?? '—'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
      <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {farms.map((farm, index) => {
          const accent = getAccent(index)
          const farmId = farm.farm_id ?? farm.id
          return (
            <Card
              key={farmId}
              className={`farm-panel relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:rounded-3xl ${accent.border} border-t-4`}
            >
              <span
                className="pointer-events-none absolute right-3 top-2 select-none text-5xl font-black text-white/5 sm:text-6xl"
                aria-hidden
              >
                {farmId}
              </span>
              <div className="relative mb-4 flex flex-wrap items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} aria-hidden />
                <span className="font-bold text-foreground">{farmId}</span>
              </div>
              <div className="relative flex flex-col gap-3 sm:gap-4">
                <YieldCard
                  farm_id={farm.farm_id}
                  farm_size_ha={farm.farm_size_ha}
                  is_small={farm.is_small}
                  yield_score={farm.yield_score}
                  expected_yield={farm.expected_yield}
                />
                <ClimateRiskCard
                  climate_risk_score={farm.climate_risk_score}
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
      )}
    </div>
  )
}
