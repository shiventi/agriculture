'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import FarmGrid from '@/components/FarmGrid'
import LoadingState from '@/components/LoadingState'
import { MOCK_RESULTS } from '@/lib/mockData'

export default function Home() {
  const [results, setResults] = useState(MOCK_RESULTS)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <>
      {isLoading && <LoadingState />}
      <div className="mx-auto min-h-[60vh] max-w-7xl px-6 py-8">
      {results == null ? (
        <UploadZone
          results={results}
          isLoading={isLoading}
          onResult={(data) => setResults(data)}
        />
      ) : (
        <FarmGrid results={results} isLoading={isLoading} />
      )}
      </div>
    </>
  )
}
