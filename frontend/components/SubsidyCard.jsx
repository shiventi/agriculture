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
    <Card className="subsidy-card h-[180px] overflow-hidden rounded-2xl border-primary/30 bg-background transition-shadow hover:shadow-lg hover:shadow-black/20">
      <CardHeader className="space-y-0 p-4 pb-0">
        <CardTitle className="text-sm font-semibold text-foreground">
          Subsidy allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        <p className="text-2xl font-bold text-primary">{formatUSD(amount)}</p>
        <Progress value={pct} className="h-1.5 rounded-full [&>div]:rounded-full [&>div]:bg-primary" />
        {is_small && (
          <Badge className="w-fit rounded-full border border-primary/50 bg-primary/20 py-1 text-primary text-[10px]">
            <Check className="mr-1 inline h-3 w-3" aria-hidden />
            Equity applied
          </Badge>
        )}
        <div className="flex gap-3 text-[11px]">
          <CardDescription className="text-muted-foreground">
            Gini: {gini_coefficient != null ? gini_coefficient.toFixed(2) : '—'}
          </CardDescription>
          <CardDescription className="text-muted-foreground">
            Small share: {small_farm_share_pct != null ? `${small_farm_share_pct}%` : '—'}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}
