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
import { formatUSD, formatHa } from '@/lib/format'

const ACCENT_BORDERS = [
  'border-t-[#588157]',
  'border-t-[#588157]',
  'border-t-[#d4a843]',
  'border-t-[#d4a843]',
  'border-t-[#76a874]',
  'border-t-[#76a874]',
  'border-t-[#c0392b]',
  'border-t-[#c0392b]',
]
const ACCENT_DOTS = [
  'bg-[#588157]',
  'bg-[#588157]',
  'bg-[#d4a843]',
  'bg-[#d4a843]',
  'bg-[#76a874]',
  'bg-[#76a874]',
  'bg-[#c0392b]',
  'bg-[#c0392b]',
]
const FALLBACK_BORDER = 'border-t-[#a8bfa8]'
const FALLBACK_DOT = 'bg-[#a8bfa8]'

function getAccent(index) {
  return {
    border: ACCENT_BORDERS[index] ?? FALLBACK_BORDER,
    dot: ACCENT_DOTS[index] ?? FALLBACK_DOT,
  }
}

export default function FarmGrid({ results, isLoading, onBack }) {
  const farms = results?.farms ?? []
  const [viewMode, setViewMode] = useState('table')

  const { summary, maxAllocation, benchmark } = useMemo(() => {
    if (!farms.length) {
      return {
        summary: { totalFarms: 0, totalBudget: 0, avgExpectedYieldHa: 0, smallFarmShare: 0, gini: null },
        maxAllocation: 0,
        benchmark: results?.benchmark,
      }
    }
    const totalBudget = farms.reduce((sum, f) => sum + (f?.subsidy_amount ?? 0), 0)
    const expectedYieldsHa = farms.map((f) => f?.expected_yield_ha ?? (f?.yield_score != null ? f.yield_score * 15 : 0))
    const avgExpectedYieldHa = expectedYieldsHa.length ? expectedYieldsHa.reduce((a, b) => a + b, 0) / expectedYieldsHa.length : 0
    const smallCount = farms.filter((f) => f?.is_small).length
    const computedSmallShare = farms.length ? (smallCount / farms.length) * 100 : 0
    const smallFarmShare = results?.fairness_metrics?.small_farm_share_pct ?? computedSmallShare
    const maxAllocation = Math.max(...farms.map((f) => f?.subsidy_amount ?? 0), 0)
    const gini = results?.fairness_metrics?.gini_coefficient ?? null
    return {
      summary: {
        totalFarms: farms.length,
        totalBudget,
        avgExpectedYieldHa,
        smallFarmShare: Math.round(Number(smallFarmShare) * 10) / 10,
        gini: gini != null ? Number(gini) : null,
      },
      maxAllocation,
      benchmark: results?.benchmark,
    }
  }, [farms, results?.fairness_metrics, results?.benchmark])

  if (farms.length === 0) {
    return (
      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          {isLoading ? 'Loading...' : 'No farm data returned. Check your CSV format.'}
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
            <span className="font-semibold text-primary">{formatHa(summary.avgExpectedYieldHa)}</span> avg expected yield
          </span>
          <Separator orientation="vertical" className="hidden h-5 bg-border sm:block" />
          <span className="summary-bar-text text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{summary.smallFarmShare}%</span> small farm share
          </span>
          {summary.gini != null && !Number.isNaN(summary.gini) && (
            <>
              <Separator orientation="vertical" className="hidden h-5 bg-border sm:block" />
              <span className="summary-bar-text text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Gini {summary.gini.toFixed(2)}</span>
              </span>
            </>
          )}
          {benchmark && (benchmark.device_name || benchmark.speedup != null) && (
            <>
              <Separator orientation="vertical" className="hidden h-5 bg-border sm:block" />
              <span className="benchmark-pill rounded-full border border-primary/30 bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary dark:border-[#588157]/30 dark:bg-[#588157]/20 dark:text-[#76a874]">
                AMD {benchmark.device_name ?? 'GPU'}
                {benchmark.speedup != null && !Number.isNaN(Number(benchmark.speedup)) ? ` · ${Number(benchmark.speedup).toFixed(1)}x faster` : ''}
              </span>
            </>
          )}
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
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Expected Yield (ha)</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Climate risk</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Subsidy</th>
                  <th className="max-w-[280px] px-4 py-3 text-left font-semibold text-foreground">Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {farms.map((farm, index) => {
                  const farmId = farm?.farm_id ?? farm?.id ?? '—'
                  const riskScore = farm?.climate_risk_score
                  const riskNum = riskScore != null ? (Number(riskScore) * 100).toFixed(0) : '—'
                  const expectedYieldHa = farm?.expected_yield_ha ?? (farm?.yield_score != null ? farm.yield_score * 15 : null)
                  return (
                    <tr
                      key={farmId}
                      className={`farms-table-row border-b border-border ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}
                    >
                      <td className="px-4 py-2.5 text-base font-medium text-foreground">{farmId}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{farm?.farm_size_ha ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center">{farm?.is_small ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{formatHa(expectedYieldHa)}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{riskNum}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-primary">{formatUSD(farm?.subsidy_amount)}</td>
                      <td className="max-w-[280px] px-4 py-2.5 text-sm leading-relaxed text-muted-foreground" title={farm?.reasoning ?? ''}>
                        <span className="line-clamp-3">{farm?.reasoning ?? '—'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {farms.map((farm, index) => {
            const accent = getAccent(index)
            const farmId = farm?.farm_id ?? farm?.id ?? '—'
            return (
              <Card
                key={farmId}
                className={`farm-panel relative overflow-hidden rounded-3xl border border-border border-t-4 p-4 transition-all duration-200 bg-card hover:shadow-[0_4px_24px_rgba(88,129,87,0.15)]`}
                style={{
                  animation: 'panel-slide-up 0.4s ease-out both',
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <span
                  className="farm-panel-watermark pointer-events-none absolute right-3 top-2 select-none text-6xl font-black dark:text-white/5 text-black/5"
                  aria-hidden
                >
                  {farmId}
                </span>
                <div className="relative mb-3 flex flex-wrap items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} aria-hidden />
                  <span className="text-lg font-bold text-foreground">{farmId}</span>
                  {farm?.crop != null && (
                    <span className="text-sm text-muted-foreground">{farm.crop}</span>
                  )}
                  {farm?.region != null && (
                    <Badge variant="outline" className="rounded-full border-border text-[10px] text-muted-foreground">
                      {farm.region}
                    </Badge>
                  )}
                </div>
                <div className="relative flex flex-col gap-3">
                  <YieldCard
                    farm_id={farm?.farm_id}
                    crop={farm?.crop}
                    region={farm?.region}
                    farm_size_ha={farm?.farm_size_ha}
                    is_small={farm?.is_small}
                    yield_score={farm?.yield_score ?? 0}
                  />
                  <ClimateRiskCard
                    climate_risk_score={farm?.climate_risk_score ?? 0}
                    temperature_c={farm?.temperature_c}
                    precipitation_mm={farm?.precipitation_mm}
                  />
                  <SubsidyCard
                    subsidy_amount={farm?.subsidy_amount}
                    subsidy_eligible={farm?.subsidy_eligible}
                    is_small={farm?.is_small}
                    gini_coefficient={farm?.gini_coefficient}
                    small_farm_share_pct={farm?.small_farm_share_pct}
                    maxAllocation={maxAllocation}
                  />
                  <ReasoningCard
                    reasoning={farm?.reasoning ?? '—'}
                    animationDelay={index * 100 + 200}
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
