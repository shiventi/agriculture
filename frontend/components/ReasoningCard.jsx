'use client'

export default function ReasoningCard({ farm_id, reasoning }) {
  return (
    <div className="card-hover flex h-full flex-col rounded-2xl bg-cream p-4 shadow-lg shadow-deep-green/15">
      <h4 className="text-sm font-semibold text-deep-green">Reasoning</h4>
      <p className="mt-1 flex-1 text-sm text-deep-green/80 line-clamp-4">
        {reasoning ?? '—'}
      </p>
    </div>
  )
}
