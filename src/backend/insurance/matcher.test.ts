import { describe, expect, it } from 'vitest'
import { matchInsuranceProducts } from './matcher'

describe('matchInsuranceProducts', () => {
  it('maps a farmer to crop insurance', () => {
    const matches = matchInsuranceProducts({ sector: 'agriculture', occupation: 'farmer' })

    expect(matches[0].type).toBe('crop')
  })

  it('maps a shop owner to business insurance', () => {
    const matches = matchInsuranceProducts({ businessType: 'retail shop' })

    expect(matches[0].type).toBe('business')
  })

  it('maps a moto rider to motorcycle insurance', () => {
    const matches = matchInsuranceProducts({ occupation: 'moto rider', hasMotorcycle: true })

    expect(matches.some((match) => match.type === 'motorcycle')).toBe(true)
  })

  it('maps a family to health insurance', () => {
    const matches = matchInsuranceProducts({ dependents: 3 })

    expect(matches[0].type).toBe('health')
  })

  it('never returns an empty list for an unknown profile', () => {
    expect(matchInsuranceProducts({})).not.toHaveLength(0)
  })
})
