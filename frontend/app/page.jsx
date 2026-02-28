'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import FarmGrid from '@/components/FarmGrid'

export default function Home() {
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-[60vh] px-6 py-8">
      {results == null ? (
        <UploadZone results={results} isLoading={isLoading} />
      ) : (
        <FarmGrid results={results} isLoading={isLoading} />
      )}
    </div>
  )
}
