'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Wheat, Cpu, Sun, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useResults } from '@/contexts/ResultsContext'
import { formatUSD } from '@/lib/format'

export default function Header() {
  const { results } = useResults()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const hasResults = (results?.farms?.length ?? 0) > 0

  useEffect(() => {
    setMounted(true)
  }, [])
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
      <header className="sticky top-0 z-50 h-14 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:h-16 transition-colors duration-200">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <a
            href="/"
            className="flex min-w-0 shrink items-center gap-2 text-inherit no-underline"
            aria-label="AgriEquity AI home"
          >
            <Wheat className="h-5 w-5 shrink-0 text-emerald-600 dark:text-primary sm:h-6 sm:w-6" aria-hidden />
            <span className="truncate text-base font-bold text-zinc-900 dark:text-white sm:text-lg">AgriEquity</span>
            <span className="truncate text-base font-bold text-emerald-600 dark:text-emerald-400 sm:text-lg">AI</span>
            <span className="relative ml-1.5 flex h-2 w-2 shrink-0 sm:ml-2" aria-hidden title="Live">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 dark:bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-primary" />
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {!mounted ? (
                <span className="h-4 w-4" aria-hidden />
              ) : theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </button>
            <Separator orientation="vertical" className="mx-1.5 h-4 bg-zinc-300 dark:bg-border sm:mx-2 sm:h-5" />
            <Badge
              variant="outline"
              className="rounded-full border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:px-3"
            >
              <Cpu className="mr-1.5 h-3 w-3" aria-hidden />
              AMD ROCm
            </Badge>
          </div>
        </div>
      </header>

      {hasResults && (
        <section
          className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 transition-colors duration-200"
          aria-label="Summary"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 sm:py-8">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
              AI-powered farm intelligence
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Yield prediction · Climate risk · Fair subsidy allocation
            </p>
            <div className="mx-auto mt-4 grid max-w-lg grid-cols-3 gap-4 sm:mt-6 sm:gap-8">
              <div className="border-r border-zinc-300 pr-4 last:border-r-0 last:pr-0 dark:border-zinc-700 sm:pr-8">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                  {summary.totalFarms}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Farms
                </p>
              </div>
              <div className="border-r border-zinc-300 pr-4 last:border-r-0 last:pr-0 dark:border-zinc-700 sm:pr-8">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                  {formatUSD(summary.totalBudget)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Allocated
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                  {summary.smallFarmShare}%
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Small farm share
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
