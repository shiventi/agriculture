'use client'

import { useState, useRef } from 'react'
import { Wheat, ChevronDown, ArrowRight, Loader2, BarChart3, CloudRain, Scale, FileSpreadsheet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MOCK_RESULTS } from '@/lib/mockData'

const SAMPLE_CSV = `farm_id,lat,lon,farm_size_ha,is_small,baseline_need
FARM_001,37.7749,-122.4194,12.5,1,85000
FARM_002,36.7783,-119.4179,45.0,0,210000
FARM_003,34.0522,-118.2437,8.2,1,60000
FARM_004,32.7157,-117.1611,25.4,0,140000
FARM_005,38.5816,-121.4944,15.8,1,92000`

const OUTPUT_PILLS = [
  { Icon: BarChart3, label: 'Yield forecast' },
  { Icon: CloudRain, label: 'Climate risk' },
  { Icon: Scale, label: 'Fair subsidies' },
]

const CONSTRAINT_FIELDS = [
  { key: 'small_farm_min_share', label: 'Small farm min share', placeholder: 'default: 40', hint: '% of total budget' },
  { key: 'per_capita_ratio', label: 'Per capita ratio', placeholder: 'default: 0.7', hint: 'small avg ÷ large avg' },
  { key: 'need_floor_dollars', label: 'Need floor (dollars)', placeholder: 'default: 50000', hint: 'baseline_need × this' },
  { key: 'max_single_farm_share', label: 'Max single farm share', placeholder: 'default: 30', hint: '% max per farm' },
  { key: 'high_risk_floor_threshold', label: 'High risk threshold', placeholder: 'default: 70', hint: 'risk score out of 100' },
  { key: 'high_risk_floor_amount', label: 'High risk floor', placeholder: 'default: 25000', hint: 'guaranteed floor $' },
]

export default function UploadZone({
  results,
  isLoading,
  onResult,
  budget,
  setBudget,
  constraints,
  updateConstraint,
}) {
  const API_BASE = 'https://592e-129-210-115-104.ngrok-free.app'

  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [constraintsExpanded, setConstraintsExpanded] = useState(false)
  const inputRef = useRef(null)

  const submitAnalysis = async () => {
    if (!selectedFile) return
    if (!selectedFile.name?.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.')
      setErrorDetail(null)
      return
    }
    setError(null)
    setErrorDetail(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const params = new URLSearchParams()
      params.append('fairness_on', 'true')
      if (budget) params.append('budget', budget)
      if (constraints?.small_farm_min_share) params.append('small_farm_min_share', constraints.small_farm_min_share)
      if (constraints?.per_capita_ratio) params.append('per_capita_ratio', constraints.per_capita_ratio)
      if (constraints?.need_floor_dollars) params.append('need_floor_dollars', constraints.need_floor_dollars)
      if (constraints?.max_single_farm_share) params.append('max_single_farm_share', constraints.max_single_farm_share)
      if (constraints?.high_risk_floor_threshold) params.append('high_risk_floor_threshold', constraints.high_risk_floor_threshold)
      if (constraints?.high_risk_floor_amount) params.append('high_risk_floor_amount', constraints.high_risk_floor_amount)

      const response = await fetch(`${API_BASE}/analyze?${params.toString()}`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        let message = `Request failed (${response.status})`
        let detail = null
        try {
          const errJson = await response.json()
          const rawDetail = errJson.detail ?? errJson.message
          message = Array.isArray(rawDetail)
            ? rawDetail.map((d) => (typeof d === 'object' && d?.msg) ? d.msg : String(d)).join(', ')
            : (typeof rawDetail === 'string' ? rawDetail : rawDetail ? JSON.stringify(rawDetail) : message)
          detail = JSON.stringify(errJson)
        } catch {
          const text = await response.text()
          detail = text || String(response.status)
        }
        setError(message)
        setErrorDetail(detail)
        return
      }

      const data = await response.json()
      console.log('Analyze response:', data)
      onResult?.(data)
    } catch (e) {
      const isNetwork = e?.name === 'TypeError' && (e?.message?.includes('fetch') || e?.message?.includes('Failed to fetch'))
      setError(isNetwork ? 'Could not connect to backend. Make sure the server is running.' : (e?.message || 'Upload failed.'))
      setErrorDetail(e?.message ?? String(e))
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

  const downloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_farms.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="upload-zone-root min-h-[50vh] bg-[#f4f7f0] sm:min-h-[60vh] dark:bg-background">
      <div className="mx-auto mt-4 max-w-2xl px-4 sm:mt-6 sm:px-6 md:max-w-3xl md:mt-8 md:p-8 lg:mt-10 lg:p-12">
        <div className="upload-card rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            <Wheat className="h-10 w-10 shrink-0 text-primary sm:h-12 sm:w-12" aria-hidden />
            <h1 className="mt-3 text-xl font-bold text-foreground sm:mt-4 sm:text-2xl">PitchFork</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload your farms CSV to begin analysis
            </p>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`drop-zone mt-4 w-full cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:mt-6 sm:p-8 md:p-10 ${
                      isDragging
                        ? 'border-primary bg-primary/10'
                        : 'border-input hover:border-primary'
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
                    <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" aria-hidden />
                    <p className="mt-2 text-foreground sm:mt-3 inline-flex items-center justify-center gap-1.5">
                      Drop CSV here
                      <span className="text-xs dark:text-[#588157]/60 text-[#588157]/50" aria-hidden>ⓘ</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
                    {selectedFile && (
                      <p className="mt-2 text-xs text-primary">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-sm p-4 text-xs font-mono dark:bg-[#1a2e1a] dark:border-[#588157]/40 dark:text-[#f0f4ee] bg-white border border-[#d4e0cc] text-[#1a2e1a] shadow-xl rounded-xl z-50"
                >
                  <div className="font-semibold text-sm non-mono mb-2 dark:text-[#76a874] text-[#588157]">
                    📋 Required CSV Format
                  </div>
                  <pre className="bg-black/20 dark:bg-black/30 rounded-lg p-2 text-xs overflow-x-auto mb-3 dark:text-[#a8bfa8] text-[#3a5a40] font-mono">
{`farm_id,lat,lon,farm_size_ha,is_small,baseline_need
FARM_001,37.7749,-122.4194,12.5,1,85000
FARM_002,36.7783,-119.4179,45.0,0,210000
FARM_003,34.0522,-118.2437,8.2,1,60000`}
                  </pre>
                  <div className="space-y-1 mb-3">
                    <div className="flex gap-2 items-start text-xs">
                      <span className="font-mono shrink-0 dark:text-[#76a874] text-[#588157]">farm_id:</span>
                      <span className="dark:text-[#a8bfa8] text-[#5a7a5a]">unique identifier (e.g. FARM_001)</span>
                    </div>
                    <div className="flex gap-2 items-start text-xs">
                      <span className="font-mono shrink-0 dark:text-[#76a874] text-[#588157]">lat/lon:</span>
                      <span className="dark:text-[#a8bfa8] text-[#5a7a5a]">GPS coordinates in decimal degrees</span>
                    </div>
                    <div className="flex gap-2 items-start text-xs">
                      <span className="font-mono shrink-0 dark:text-[#76a874] text-[#588157]">farm_size_ha:</span>
                      <span className="dark:text-[#a8bfa8] text-[#5a7a5a]">farm area in hectares</span>
                    </div>
                    <div className="flex gap-2 items-start text-xs">
                      <span className="font-mono shrink-0 dark:text-[#76a874] text-[#588157]">is_small:</span>
                      <span className="dark:text-[#a8bfa8] text-[#5a7a5a]">1 for small farm, 0 for large farm</span>
                    </div>
                    <div className="flex gap-2 items-start text-xs">
                      <span className="font-mono shrink-0 dark:text-[#76a874] text-[#588157]">baseline_need:</span>
                      <span className="dark:text-[#a8bfa8] text-[#5a7a5a]">minimum funding requirement in dollars</span>
                    </div>
                  </div>
                  <p className="text-xs italic opacity-60 dark:text-[#a8bfa8] text-[#5a7a5a]">
                    All columns required. First row must be header.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <button
              type="button"
              onClick={downloadSampleCsv}
              className="mt-2 text-xs dark:text-[#588157] text-[#588157] hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Need a template? Download sample CSV →
            </button>

            {error && (
              <div className="mt-4 w-full rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-left">
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
                {errorDetail && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                    {errorDetail}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 w-full text-left sm:mt-8">
              <p className="text-xs text-muted-foreground">
                Configuration
              </p>
              <Separator className="mb-4 mt-2 bg-border" />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">
                  Total budget
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="1000000"
                    value={budget ?? ''}
                    onChange={(e) => setBudget?.(e.target.value)}
                    className="h-9 bg-input pl-8 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring border-border"
                  />
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  Default: $1,000,000
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Fairness constraints
                  </span>
                  <Badge
                    variant="outline"
                    className="all-optional-badge rounded-full border-border bg-muted/80 text-xs text-muted-foreground"
                  >
                    All optional
                  </Badge>
                </div>
                <p className="mt-1 mb-3 text-xs text-muted-foreground">
                  Leave blank to use default values
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConstraintsExpanded((v) => !v)}
                  className="advanced-constraints-btn w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 ${constraintsExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                  Advanced constraints
                </Button>

                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: constraintsExpanded ? 400 : 0 }}
                >
                  <div className="constraints-wrapper mt-3 rounded-2xl border border-border bg-card/50 p-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {CONSTRAINT_FIELDS.map(({ key, label, placeholder, hint }) => (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">{label}</label>
                          <Input
                            type="number"
                            placeholder={placeholder}
                            value={constraints?.[key] ?? ''}
                            onChange={(e) => updateConstraint?.(key, e.target.value)}
                            className="h-8 bg-input text-sm text-foreground placeholder:text-muted-foreground focus:border-primary border-border"
                          />
                          <span className="text-xs text-muted-foreground">{hint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={submitAnalysis}
                disabled={!selectedFile || uploading}
                className="mt-4 h-10 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze farms
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </Button>
            </div>

            <div className="output-pills mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3">
              {OUTPUT_PILLS.map(({ Icon, label }) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="cursor-default rounded-full border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:px-4"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </Badge>
              ))}
            </div>

            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={loadMockData}
              className="load-sample-data-btn mt-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Load sample data
            </Button>
          </div>
        </div>
      </div>

      {uploading && (
        <div
          className="uploading-overlay fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 text-foreground"
          role="status"
          aria-live="polite"
          aria-label="Analyzing farms"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          <p className="text-base font-medium sm:text-lg">Analyzing farms...</p>
        </div>
      )}
    </div>
  )
}
