'use client'

import { Coins, Check } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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
  maxAllocation,
}) {
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
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              Before constraint: <span className="font-medium tabular-nums text-foreground">{formatUSD(before)}</span>
            </p>
            <p className="subsidy-amount text-[22px] font-bold tabular-nums text-primary">
              After fairness: {formatUSD(amount)}
            </p>
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
          <div className="subsidy-stat-box rounded-lg border border-border bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Gini Index</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {gini_coefficient != null ? gini_coefficient.toFixed(2) : '—'}
            </p>
          </div>
          <div className="subsidy-stat-box rounded-lg border border-border bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Small Farm Share</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {small_farm_share_pct != null ? `${small_farm_share_pct}%` : '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
