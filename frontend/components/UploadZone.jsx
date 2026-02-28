'use client'

import { useState, useRef } from 'react'

function WheatIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M24 4v56M24 4c-4 8-8 16-8 28 0 6 2 12 8 12s8-6 8-12c0-12-4-20-8-28zm0 0c4 8 8 16 8 28 0 6-2 12-8 12s-8-6-8-12c0-12 4-20 8-28z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="24" cy="12" rx="6" ry="4" fill="currentColor" opacity="0.9" />
      <ellipse cx="24" cy="22" rx="7" ry="5" fill="currentColor" opacity="0.85" />
      <ellipse cx="24" cy="34" rx="6" ry="4" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function WheatGrowthAnimation() {
  return (
    <svg
      className="h-32 w-12"
      viewBox="0 0 48 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="upload-stalk" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1a3a2a" />
          <stop offset="100%" stopColor="#2d8a6e" />
        </linearGradient>
      </defs>
      <path
        d="M24 120 V0"
        stroke="url(#upload-stalk)"
        strokeWidth="4"
        strokeLinecap="round"
        className="wheat-stalk origin-bottom"
      />
      <g className="wheat-head">
        <ellipse cx="24" cy="8" rx="10" ry="6" fill="#d4a843" />
        <ellipse cx="24" cy="18" rx="12" ry="7" fill="#d4a843" />
        <ellipse cx="24" cy="30" rx="10" ry="6" fill="#d4a843" />
      </g>
    </svg>
  )
}

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

  return (
    <>
      <div
        className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/60 bg-deep-green/50 px-16 py-20 transition-colors md:py-28"
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
        style={{
          borderColor: isDragging ? 'var(--gold)' : undefined,
          backgroundColor: isDragging ? 'rgba(26, 58, 42, 0.8)' : undefined,
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
        <div className="mb-6 text-gold">
          <WheatIcon className="h-16 w-12 md:h-20 md:w-16" />
        </div>
        <p className="text-2xl font-semibold text-cream md:text-3xl">
          Drop your farms CSV
        </p>
        <p className="mt-2 text-sm text-cream/80">or click to browse</p>
        {error && (
          <p className="mt-4 text-sm text-soft-red" role="alert">
            {error}
          </p>
        )}
      </div>

      {uploading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-deep-green/95 text-cream"
          role="status"
          aria-live="polite"
          aria-label="Analyzing farms"
        >
          <WheatGrowthAnimation />
          <p className="text-lg font-medium">Analyzing farms...</p>
        </div>
      )}
    </>
  )
}
