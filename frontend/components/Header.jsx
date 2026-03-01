'use client'

import Image from 'next/image'
import { useMemo, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Cpu, Sun, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useResults } from '@/contexts/ResultsContext'
import { formatUSD } from '@/lib/format'

export default function Header() {
  const { results } = useResults()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const hasResults = (results?.farms?.length ?? 0) > 0
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

  useEffect(() => setMounted(true), [])

  return (
    <>
      <header className="site-header sticky top-0 z-50 h-14 w-full border-b border-border bg-background sm:h-16">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <a
            href="/"
            className="flex min-w-0 shrink items-center gap-2 text-inherit no-underline"
            aria-label="PitchFork home"
          >
            <Image
              src="/fork.jpg"
              alt="AgriEquity AI Logo"
              width={36}
              height={36}
              className="rounded-full opacity-95 dark:opacity-80 object-cover shrink-0 logo-icon h-9 w-9 sm:h-9 sm:w-9 border-0 ring-0"
            />
            <span className="logo-agri truncate text-base font-bold text-foreground sm:text-lg">PitchFork</span>
          </a>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="theme-toggle-btn relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {!mounted ? <span className="h-4 w-4" aria-hidden /> : theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            </button>
            <Separator orientation="vertical" className="mx-1.5 h-4 bg-border sm:mx-2 sm:h-5" />
            <Badge
              variant="outline"
              className="header-amd-badge flex items-center gap-2 rounded-full border-border bg-card px-2.5 py-1 text-xs text-muted-foreground sm:px-3 hover:text-foreground transition-colors"
            >
              <Cpu className="h-3 w-3 shrink-0" aria-hidden />
              AMD ROCm
            </Badge>
          </div>
        </div>
      </header>

      {hasResults && (
        <section
          className="hero-banner border-b border-border bg-card"
          aria-label="Summary"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 sm:py-8">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Here is your results
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Yield prediction · Climate risk · Fair subsidy allocation
            </p>
            <div className="mx-auto mt-4 grid max-w-lg grid-cols-3 gap-4 sm:mt-6 sm:gap-8">
              <div className="border-r border-border pr-4 last:border-r-0 last:pr-0 sm:pr-8">
                <p className="text-xl font-bold text-primary sm:text-2xl">
                  {summary.totalFarms}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Farms
                </p>
              </div>
              <div className="border-r border-border pr-4 last:border-r-0 last:pr-0 sm:pr-8">
                <p className="text-xl font-bold text-primary sm:text-2xl">
                  {formatUSD(summary.totalBudget)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Allocated
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary sm:text-2xl">
                  {summary.smallFarmShare}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
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
