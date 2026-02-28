'use client'

import YieldCard from '@/components/YieldCard'
import ClimateRiskCard from '@/components/ClimateRiskCard'
import SubsidyCard from '@/components/SubsidyCard'
import ReasoningCard from '@/components/ReasoningCard'

export default function FarmGrid({ results, isLoading }) {
  const farms = results?.farms ?? []

  if (farms.length === 0) {
    return (
      <div className="text-center text-cream/80 py-12">
        {isLoading ? 'Loading...' : 'No farm data to display.'}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {farms.map((farm) => (
        <div
          key={farm.farm_id ?? farm.id}
          className="grid grid-rows-4 gap-4"
          style={{ minHeight: '720px' }}
        >
          <div className="min-h-0">
            <YieldCard
            farm_id={farm.farm_id}
            crop={farm.crop}
            region={farm.region}
            farm_size_ha={farm.farm_size_ha}
            is_small={farm.is_small}
            yield_score={farm.yield_score}
            />
          </div>
          <div className="min-h-0">
            <ClimateRiskCard
              farm_id={farm.farm_id}
              climate_risk_score={farm.climate_risk_score}
            />
          </div>
          <div className="min-h-0">
            <SubsidyCard
              farm_id={farm.farm_id}
              subsidy_amount={farm.subsidy_amount}
              subsidy_eligible={farm.subsidy_eligible}
            />
          </div>
          <div className="min-h-0">
            <ReasoningCard
              farm_id={farm.farm_id}
              reasoning={farm.reasoning}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
