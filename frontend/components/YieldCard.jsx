'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatUSD } from '@/lib/format'

export default function YieldCard({
  farm_id,
  farm_size_ha,
  is_small,
  yield_score,
  expected_yield,
}) {
  const amount = expected_yield ?? (yield_score != null ? yield_score * 50000 : null)

  return (
    <Card className="yield-card h-[200px] overflow-hidden rounded-2xl border-border bg-card">
      <CardHeader className="space-y-1 p-4 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            Expected Yield
          </CardTitle>
          {is_small && (
            <Badge className="rounded-full border-0 bg-primary/20 text-[10px] text-primary">
              Small farm
            </Badge>
          )}
        </div>
        {farm_size_ha != null && (
          <p className="text-xs text-muted-foreground">{farm_size_ha} ha</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4 pt-2">
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {formatUSD(amount)}
        </p>
      </CardContent>
    </Card>
  )
}
