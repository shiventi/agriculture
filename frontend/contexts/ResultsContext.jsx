'use client'

import { createContext, useContext, useState } from 'react'

const ResultsContext = createContext(null)

export function ResultsProvider({ children }) {
  const [results, setResults] = useState(null)
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
