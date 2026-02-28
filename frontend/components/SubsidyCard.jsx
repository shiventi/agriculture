'use client'

export default function SubsidyCard({ farm_id, subsidy_amount, subsidy_eligible }) {
  return (
    <div className="rounded-2xl bg-cream p-4 shadow-lg shadow-deep-green/15">
      <h4 className="text-sm font-semibold text-deep-green">Subsidy</h4>
      <p className="mt-1 text-lg font-bold text-teal">
        {subsidy_amount != null ? `$${subsidy_amount}` : '—'}
      </p>
      {subsidy_eligible != null && (
        <p className="mt-0.5 text-xs text-deep-green/70">
          {subsidy_eligible ? 'Eligible' : 'Not eligible'}
        </p>
      )}
    </div>
  )
}
