'use client'

import { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { MOCK_RESULTS } from '@/lib/mockData'

const OUTPUT_PILLS = [
  { icon: '◆', label: 'Yield Forecast' },
  { icon: '⚠', label: 'Climate Risk' },
  { icon: '⚖', label: 'Fair Subsidies' },
]

const CONSTRAINT_FIELDS = [
  { key: 'small_farm_min_share', label: 'Small Farm Min Share', placeholder: 'default: 40', hint: '% of total budget' },
  { key: 'per_capita_ratio', label: 'Per Capita Ratio', placeholder: 'default: 0.7', hint: 'small avg ÷ large avg' },
  { key: 'need_floor_dollars', label: 'Need Floor (dollars)', placeholder: 'default: 50000', hint: 'baseline_need × this' },
  { key: 'max_single_farm_share', label: 'Max Single Farm Share', placeholder: 'default: 30', hint: '% max per farm' },
  { key: 'high_risk_floor_threshold', label: 'High Risk Threshold', placeholder: 'default: 70', hint: 'risk score out of 100' },
  { key: 'high_risk_floor_amount', label: 'High Risk Floor', placeholder: 'default: 25000', hint: 'guaranteed floor $' },
]

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

export default function UploadZone({
  results,
  isLoading,
  onResult,
  budget,
  setBudget,
  constraints,
  updateConstraint,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [constraintsExpanded, setConstraintsExpanded] = useState(false)
  const inputRef = useRef(null)

  const baseUrl = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:8000'

  const submitAnalysis = async () => {
    if (!selectedFile) return
    if (!selectedFile.name?.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const params = new URLSearchParams()
      params.append('fairness_on', 'true')
      if (budget) params.append('budget', budget)
      Object.entries(constraints).forEach(([k, v]) => params.append(k, String(v)))
      const url = `${baseUrl}/analyze?${params.toString()}`
      const form = new FormData()
      form.append('file', selectedFile)
      const res = await fetch(url, { method: 'POST', body: form })
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

  const handleFileSelect = (file) => {
    if (!file) return
    setSelectedFile(file)
    setError(null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFileSelect(file)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onInputChange = (e) => {
    const file = e.target?.files?.[0]
    if (file) handleFileSelect(file)
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
            className={`mt-6 w-full cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
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
            {selectedFile && (
              <p className="mt-2 text-xs text-emerald-400">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* Configuration */}
          <div className="mt-8 w-full text-left">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Configuration
            </p>
            <Separator className="mb-4 mt-2 bg-zinc-800" />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-300">
                Total Budget
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-9 bg-zinc-800 pl-7 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 border-zinc-700"
                />
              </div>
              <span className="mt-1 text-xs text-zinc-600">
                Default: $1,000,000
              </span>
            </div>

            {/* Fairness constraints */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  Fairness Constraints
                </span>
                <Badge
                  variant="outline"
                  className="rounded-full border-zinc-700 bg-zinc-800/80 text-xs text-zinc-400"
                >
                  All Optional
                </Badge>
              </div>
              <p className="mt-1 mb-3 text-xs text-zinc-600">
                Leave blank to use default values
              </p>

              <button
                type="button"
                onClick={() => setConstraintsExpanded((v) => !v)}
                className="flex w-full items-center gap-1 text-xs text-zinc-500 cursor-pointer hover:text-zinc-400"
              >
                <span
                  className={`inline-block transition-transform duration-200 ${constraintsExpanded ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  ▼
                </span>
                Advanced Constraints
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: constraintsExpanded ? 400 : 0 }}
              >
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    {CONSTRAINT_FIELDS.map(({ key, label, placeholder, hint }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400">{label}</label>
                        <Input
                          type="number"
                          placeholder={placeholder}
                          value={constraints[key] ?? ''}
                          onChange={(e) => updateConstraint(key, e.target.value)}
                          className="h-8 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 border-zinc-700"
                        />
                        <span className="text-xs text-zinc-600">{hint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={submitAnalysis}
              disabled={!selectedFile}
              className="mt-4 h-10 w-full rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Analyze Farms →
            </Button>
          </div>

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
