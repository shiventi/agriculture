'use client'

import { Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatUSD } from '@/lib/format'

export default function SubsidyCard({
  farm_id,
  subsidy_amount,
  subsidy_eligible,
  is_small,
  gini_coefficient,
  small_farm_share_pct,
}) {
  const amount = subsidy_amount ?? 0
  const maxAmount = 2000
  const pct = maxAmount > 0 ? Math.min(100, (amount / maxAmount) * 100) : 0

  return (
    <Card className="h-[180px] overflow-hidden rounded-2xl border border-emerald-200 bg-zinc-50 transition-shadow duration-200 hover:shadow-lg hover:shadow-black/20 dark:border-[hsl(82,50%,32%)]/30 dark:bg-[#243010]">
      <CardHeader className="space-y-0 p-4 pb-0">
        <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-[hsl(0,0%,98%)]">
          Subsidy allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        <p className="text-2xl font-bold text-emerald-600 dark:text-[#d4a843]">{formatUSD(amount)}</p>
        <Progress value={pct} className="h-1.5 rounded-full bg-zinc-200 dark:bg-[hsl(84,8%,22%)] [&>div]:rounded-full [&>div]:bg-emerald-500 [&>div]:dark:bg-[hsl(82,50%,32%)]" />
        {is_small && (
          <Badge className="w-fit rounded-full border border-emerald-200 bg-emerald-50 py-1 text-[10px] text-emerald-700 dark:border-[hsl(82,50%,32%)]/30 dark:bg-[hsl(82,50%,32%)]/20 dark:text-[hsl(82,50%,60%)]">
            <Check className="mr-1 inline h-3 w-3" aria-hidden />
            Equity applied
          </Badge>
        )}
        <div className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-100/50 px-2 py-1.5 text-[11px] dark:border-[hsl(84,8%,22%)] dark:bg-[#1F211C]">
          <CardDescription className="text-zinc-500 dark:text-[hsl(84,8%,58%)]">
            Gini: <span className="text-zinc-700 dark:text-[hsl(0,0%,98%)]">{gini_coefficient != null ? gini_coefficient.toFixed(2) : '—'}</span>
          </CardDescription>
          <CardDescription className="text-zinc-500 dark:text-[hsl(84,8%,58%)]">
            Small share: <span className="text-zinc-700 dark:text-[hsl(0,0%,98%)]">{small_farm_share_pct != null ? `${small_farm_share_pct}%` : '—'}</span>
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}
