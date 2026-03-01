'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft } from 'lucide-react'
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

  const handleBackToUpload = () => {
    setResults(null)
    setBudget('')
    setConstraints({})
  }

  return (
    <>
      {isLoading && <LoadingState />}
      <div className="relative z-10 mx-auto min-h-[50vh] max-w-7xl px-4 py-4 sm:min-h-[60vh] sm:px-6 sm:py-6">
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
          <>
            <div className="mx-auto max-w-7xl px-6">
              <button
                type="button"
                onClick={handleBackToUpload}
                className="mb-6 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white group"
              >
                <ChevronLeft className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-emerald-400" aria-hidden />
                Back to Upload
              </button>
            </div>
            <FarmGrid
              results={results}
              isLoading={isLoading}
              onBack={handleBackToUpload}
            />
          </>
        )}
      </div>
    </>
  )
}
