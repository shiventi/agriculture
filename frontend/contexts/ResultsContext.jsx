'use client'

import { createContext, useContext, useState } from 'react'
import { MOCK_RESULTS } from '@/lib/mockData'

const ResultsContext = createContext(null)

export function ResultsProvider({ children }) {
  const [results, setResults] = useState(MOCK_RESULTS)
  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      {children}
    </ResultsContext.Provider>
  )
}

export function useResults() {
  const ctx = useContext(ResultsContext)
  if (!ctx) throw new Error('useResults must be used within ResultsProvider')
  return ctx
}
