'use client'

import { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { MOCK_RESULTS } from '@/lib/mockData'

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

const OUTPUT_PILLS = [
  { icon: '◆', label: 'Yield Forecast' },
  { icon: '⚠', label: 'Climate Risk' },
  { icon: '⚖', label: 'Fair Subsidies' },
]

export default function UploadZone({ results, isLoading, onResult }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file || !file.name?.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('http://localhost:8000/analyze?fairness_on=true', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed (${res.status})`)
      }
      const data = await res.json()
      onResult?.(data)
    } catch (e) {
      setError(e.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onInputChange = (e) => {
    const file = e.target?.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const loadMockData = () => {
    setError(null)
    onResult?.(MOCK_RESULTS)
  }

  return (
    <div className="min-h-[60vh] bg-zinc-950">
      <div className="mx-auto mt-24 max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-12">
        <div className="flex flex-col items-center text-center">
          <WheatLeafIcon className="h-12 w-12 shrink-0 text-[#00ff87]" />
          <h1 className="mt-4 text-2xl font-bold text-white">AgriEquity AI</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Upload your farms CSV to begin analysis
          </p>

          <div
            className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-950/20'
                : 'border-zinc-700 hover:border-emerald-500'
            }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="sr-only"
              aria-label="Select CSV file"
              onChange={onInputChange}
              disabled={uploading}
            />
            <p className="text-zinc-300">Drop CSV here</p>
            <p className="mt-1 text-sm text-zinc-500">or click to browse</p>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {OUTPUT_PILLS.map(({ icon, label }) => (
              <Badge
                key={label}
                variant="outline"
                className="cursor-default rounded-full border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-300"
              >
                {icon} {label}
              </Badge>
            ))}
          </div>

          <button
            type="button"
            onClick={loadMockData}
            className="mt-6 text-xs text-zinc-500 underline hover:text-zinc-400"
          >
            Load sample data
          </button>
        </div>
      </div>

      {uploading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-zinc-950/95 text-zinc-100"
          role="status"
          aria-live="polite"
          aria-label="Analyzing farms"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-lg font-medium">Analyzing farms...</p>
        </div>
      )}
    </div>
  )
}
