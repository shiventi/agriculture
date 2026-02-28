'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useResults } from '@/contexts/ResultsContext'
import { formatUSD } from '@/lib/format'

function WheatLeafIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2c-2 4-4 8-4 14 0 4 2 8 6 8s6-4 6-8c0-6-2-10-4-14" />
      <path d="M12 2c2 4 4 8 4 14 0 4-2 8-6 8s-6-4-6-8c0-6 2-10 4-14" />
      <ellipse cx="12" cy="8" rx="4" ry="3" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

const NAV_ITEMS = [
  { icon: '◆', label: 'Yield Forecast' },
  { icon: '⚠', label: 'Climate Risk' },
  { icon: '⚖', label: 'Fair Subsidies' },
]

export default function Header() {
  const { results } = useResults()
  const summary = useMemo(() => {
    const farms = results?.farms ?? []
    if (!farms.length)
      return { totalFarms: 0, totalBudget: 0, smallFarmShare: 0 }
    const totalBudget = farms.reduce((sum, f) => sum + (f.subsidy_amount ?? 0), 0)
    const smallCount = farms.filter((f) => f.is_small).length
    const smallFarmShare = Math.round((smallCount / farms.length) * 1000) / 10
    return {
      totalFarms: farms.length,
      totalBudget,
      smallFarmShare,
    }
  }, [results])

  return (
    <>
      <header className="sticky top-0 z-50 h-16 w-full border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <a
            href="/"
            className="flex items-center gap-2 text-inherit no-underline"
            aria-label="AgriEquity AI home"
          >
            <WheatLeafIcon className="h-4 w-4 shrink-0 text-[#00ff87]" />
            <span className="text-lg font-bold text-white">AgriEquity</span>
            <span className="text-lg font-bold text-[#00ff87]">AI</span>
            <span className="relative ml-2 flex h-2 w-2" aria-hidden title="Live">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </a>

          <div className="hidden items-center gap-3 md:flex">
            {NAV_ITEMS.map(({ icon, label }) => (
              <Badge
                key={label}
                variant="outline"
                className="cursor-default rounded-full border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                {icon} {label}
              </Badge>
            ))}
          </div>

          <div className="flex items-center">
            <Separator orientation="vertical" className="mx-2 h-5 bg-zinc-700" />
            <Badge
              variant="outline"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-400"
            >
              AMD ROCm
            </Badge>
          </div>
        </div>
      </header>

      <section
        className="border-b border-zinc-800 bg-zinc-900"
        aria-label="Introduction"
      >
        <div className="mx-auto max-w-7xl px-6 py-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            AI-Powered Farm Intelligence
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Yield prediction · Climate risk · Fair subsidy allocation
          </p>
          <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-8">
            <div className="border-r border-zinc-700 pr-8 last:border-r-0 last:pr-0">
              <p className="text-2xl font-bold text-emerald-400">
                {summary.totalFarms}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                Farms
              </p>
            </div>
            <div className="border-r border-zinc-700 pr-8 last:border-r-0 last:pr-0">
              <p className="text-2xl font-bold text-emerald-400">
                {formatUSD(summary.totalBudget)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                Allocated
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {summary.smallFarmShare}%
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                Small Farm Share
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
