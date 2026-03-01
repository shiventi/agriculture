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
  subsidy_eligible,
  is_small,
  gini_coefficient,
  small_farm_share_pct,
  maxAllocation,
}) {
  const amount = subsidy_amount ?? 0
  const max = maxAllocation != null && maxAllocation > 0 ? maxAllocation : amount || 1
  const pct = Math.min(100, (amount / max) * 100)
  const showEquity = subsidy_eligible || is_small

  return (
    <Card className="subsidy-card h-[200px] overflow-hidden rounded-2xl border dark:border-[#588157]/40 dark:bg-[#3a5a40] border-[#c4d4bc] bg-[#edf5e8]">
      <CardHeader className="space-y-0 p-3 pb-0">
        <div className="flex items-center gap-2">
          <Coins className="h-3.5 w-3.5 shrink-0 dark:text-[#a8bfa8] text-[#5a7a5a" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-widest dark:text-[#a8bfa8] text-[#5a7a5a]">
            Subsidy Allocation
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-2">
        <p className="text-[28px] font-bold tabular-nums dark:text-[#d4a843] text-[#c49a30]">
          {formatUSD(amount)}
        </p>
        <Progress
          value={pct}
          className="mt-2 h-2 w-full dark:[&>div]:bg-[#588157] [&>div]:bg-[#588157]"
        />
        {showEquity && (
          <div className="flex items-center gap-1.5 rounded-lg border py-1.5 px-2 dark:bg-[#588157]/20 dark:text-[#76a874] dark:border-[#588157]/30 bg-[#e8f0e4] text-[#588157] border-[#c4d4bc]">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="text-xs font-medium">Equity constraints applied</span>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-2 dark:bg-[#2d4433] dark:border-[#588157]/25 bg-[#f4f7f0] border-[#d4e0cc]">
            <p className="text-xs dark:text-[#a8bfa8] text-[#5a7a5a]">Gini Index</p>
            <p className="text-sm font-bold tabular-nums dark:text-[#f0f4ee] text-[#1a2e1a]">
              {gini_coefficient != null ? gini_coefficient.toFixed(2) : '—'}
            </p>
          </div>
          <div className="rounded-lg border p-2 dark:bg-[#2d4433] dark:border-[#588157]/25 bg-[#f4f7f0] border-[#d4e0cc]">
            <p className="text-xs dark:text-[#a8bfa8] text-[#5a7a5a]">Small Farm Share</p>
            <p className="text-sm font-bold tabular-nums dark:text-[#f0f4ee] text-[#1a2e1a]">
              {small_farm_share_pct != null ? `${small_farm_share_pct}%` : '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
