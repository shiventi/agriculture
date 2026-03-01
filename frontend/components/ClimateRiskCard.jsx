'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClimateRiskCard({ climate_risk_score }) {
  const score = climate_risk_score ?? 0
  const riskNum = score <= 1 ? (score * 100).toFixed(0) : String(Math.round(score))

  return (
    <Card className="climate-card h-[200px] overflow-hidden rounded-2xl border-border bg-card">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-4 pb-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <CardTitle className="text-sm font-semibold text-foreground">Climate risk</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-2xl font-bold tabular-nums text-foreground">{riskNum}</p>
      </CardContent>
    </Card>
  )
}
