'use client'

import { useState, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import FarmGrid from '@/components/FarmGrid'
import LoadingState from '@/components/LoadingState'
import { useResults } from '@/contexts/ResultsContext'

export default function Home() {
  const { results, setResults } = useResults()
  const [isLoading, setIsLoading] = useState(false)
  const [budget, setBudget] = useState('')
  const [constraints, setConstraints] = useState({})

  const updateConstraint = useCallback((key, value) => {
    setConstraints((prev) => {
      const next = { ...prev }
      if (value !== '' && value != null) {
        next[key] = value
      } else {
        delete next[key]
      }
      return next
    })
  }, [])

  return (
    <>
      {isLoading && <LoadingState />}
      <div className="relative z-10 mx-auto min-h-[60vh] max-w-7xl px-6 py-6">
        {results == null ? (
          <UploadZone
            results={results}
            isLoading={isLoading}
            onResult={(data) => setResults(data)}
            budget={budget}
            setBudget={setBudget}
            constraints={constraints}
            updateConstraint={updateConstraint}
          />
        ) : (
          <FarmGrid results={results} isLoading={isLoading} />
        )}
      </div>
    </>
  )
}
