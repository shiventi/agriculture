'use client'

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
    <Card className="h-[180px] overflow-hidden border-emerald-900/30 bg-zinc-950 transition-shadow hover:shadow-lg hover:shadow-black/20">
      <CardHeader className="space-y-0 p-4 pb-0">
        <CardTitle className="text-sm font-semibold text-zinc-100">
          Subsidy Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        <p className="text-2xl font-bold text-[#00ff87]">{formatUSD(amount)}</p>
        <Progress value={pct} className="h-1.5 [&>div]:bg-emerald-500" />
        {is_small && (
          <Badge className="w-fit border border-emerald-800 bg-emerald-950/80 text-emerald-400 text-[10px]">
            ✓ Equity Applied
          </Badge>
        )}
        <div className="flex gap-3 text-[11px]">
          <CardDescription className="text-zinc-500">
            Gini: {gini_coefficient != null ? gini_coefficient.toFixed(2) : '—'}
          </CardDescription>
          <CardDescription className="text-zinc-500">
            Small share: {small_farm_share_pct != null ? `${small_farm_share_pct}%` : '—'}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}
