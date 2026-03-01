'use client'

import { BarChart2, Coins, Check, Info, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const formatUSD = (value) => {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function SubsidyCard({
  subsidy_amount,
  subsidy_before,
  subsidy_eligible,
  is_small,
  gini_coefficient,
  small_farm_share_pct,
  overallGini,
  overallSmallFarmSharePct,
  maxAllocation,
}) {
  const gini = gini_coefficient ?? overallGini
  const smallShare = small_farm_share_pct ?? overallSmallFarmSharePct
  const amount = subsidy_amount ?? 0
  const before = subsidy_before != null ? subsidy_before : null
  const max = maxAllocation != null && maxAllocation > 0 ? maxAllocation : amount || 1
  const pct = Math.min(100, (amount / max) * 100)
  const showEquity = subsidy_eligible || is_small

  return (
    <Card className="subsidy-card min-h-[200px] overflow-hidden rounded-2xl border border-border bg-card">
      <CardHeader className="space-y-0 p-3 pb-0">
        <div className="flex items-center gap-2">
          <Coins className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Subsidy Allocation
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-2">
        {before != null ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Before</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 shrink-0 cursor-help text-muted-foreground" aria-label="Info" />
                  </TooltipTrigger>
                  <TooltipContent side="top">Subsidy before fairness</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="ml-auto font-medium tabular-nums text-foreground">{formatUSD(before)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">After</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 shrink-0 cursor-help text-muted-foreground" aria-label="Info" />
                  </TooltipTrigger>
                  <TooltipContent side="top">Subsidy after fairness</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="subsidy-amount ml-auto text-lg font-bold tabular-nums text-primary">{formatUSD(amount)}</span>
            </div>
          </div>
        ) : (
          <p className="subsidy-amount text-[28px] font-bold tabular-nums text-primary">
            {formatUSD(amount)}
          </p>
        )}
        <Progress
          value={pct}
          className="mt-2 h-2 w-full [&>div]:bg-primary"
        />
        {showEquity && (
          <div className="equity-banner flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/20 py-1.5 px-2 text-primary">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="text-xs font-medium">Equity constraints applied</span>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="subsidy-stat-box flex flex-col gap-0.5 rounded-lg border border-border bg-muted/50 p-2">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <BarChart2 className="h-3 w-3 shrink-0" aria-hidden />
              Gini Index
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {gini != null && !Number.isNaN(gini) ? gini.toFixed(2) : '—'}
            </p>
          </div>
          <div className="subsidy-stat-box flex flex-col gap-0.5 rounded-lg border border-border bg-muted/50 p-2">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" aria-hidden />
              Small Farm Share
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {smallShare != null && !Number.isNaN(smallShare) ? `${smallShare}%` : '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
