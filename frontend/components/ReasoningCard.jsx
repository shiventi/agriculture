'use client'

export default function ReasoningCard({ farm_id, reasoning }) {
  return (
    <div className="rounded-2xl bg-cream p-4 shadow-lg shadow-deep-green/15">
      <h4 className="text-sm font-semibold text-deep-green">Reasoning</h4>
      <p className="mt-1 text-sm text-deep-green/80 line-clamp-4">
        {reasoning ?? '—'}
      </p>
    </div>
  )
}
