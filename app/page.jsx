'use client'

import { useState } from 'react'
import { MOCK_RESULTS } from '@/lib/mockData'

export default function Home() {
  const [results, setResults] = useState(MOCK_RESULTS)
  const [isMockData, setIsMockData] = useState(true)

  // When real API data replaces mock: setResults(apiData); setIsMockData(false)

  return (
    <main className="min-h-screen p-8 bg-cream">
      {isMockData && (
        <div className="mb-4 rounded-md bg-yellow-200 px-4 py-2 text-center text-sm font-medium text-yellow-900">
          Using mock data
        </div>
      )}
      <h1 className="text-deep-green text-2xl font-semibold">Agriculture</h1>
      <section className="mt-6">
        <p className="text-deep-green/80">
          Dashboard loaded with {results?.data?.length ?? 0} rows
          {results?.columns?.length ? ` (${results.columns.length} columns)` : ''}.
        </p>
      </section>
    </main>
  )
}
