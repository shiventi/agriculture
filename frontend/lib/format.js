const usdFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatUSD(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return usdFormat.format(value)
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—'
  const pct = Math.round(Number(value) * 100)
  return `${pct}%`
}
