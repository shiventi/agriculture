'use client'

import { formatUSD } from '@/lib/format'

export default function SubsidyCard({ farm_id, subsidy_amount, subsidy_eligible }) {
  return (
    <div className="card-hover flex h-full flex-col rounded-2xl bg-cream p-4 shadow-lg shadow-deep-green/15">
      <h4 className="text-sm font-semibold text-deep-green">Subsidy</h4>
      <p className="mt-1 flex-1 text-lg font-bold text-teal">{formatUSD(subsidy_amount)}</p>
      {subsidy_eligible != null && (
        <p className="mt-0.5 text-xs text-deep-green/70">
          {subsidy_eligible ? 'Eligible' : 'Not eligible'}
        </p>
      )}
    </div>
  )
}
