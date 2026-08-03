/**
 * Insurance matcher (build plan §6.4): a deterministic rules table maps
 * profile attributes to product categories — a farmer to crop insurance, a
 * shop owner to business insurance, a moto rider to motorcycle insurance,
 * a family to health insurance. The LLM is used later only to write the
 * plain-language explanation, never to pick the products.
 *
 * Premiums are demo-plausible monthly RWF ranges, returned in minor units.
 */
export type InsuranceProductType = 'crop' | 'business' | 'motorcycle' | 'health' | 'life'

export type InsuranceProduct = {
  id: string
  type: InsuranceProductType
  name: string
  premiumRangeMinor: [string, string]
  description: string
}

export type InsuranceProfile = {
  sector?: string
  occupation?: string
  businessType?: string
  hasMotorcycle?: boolean
  dependents?: number
}

export type RankedRecommendation = InsuranceProduct & {
  rank: number
  reason: string
  /** Deterministic 0-100 fit computed from matched profile signals. */
  matchScore: number
}

const PRODUCTS: Record<InsuranceProductType, Omit<InsuranceProduct, 'type'>> = {
  crop: {
    id: 'crop',
    name: 'Crop & harvest insurance',
    premiumRangeMinor: ['8000', '25000'],
    description:
      'Protects harvest value against drought, pests, and disease — a fit if your income depends on farming.',
  },
  business: {
    id: 'business',
    name: 'SME business insurance',
    premiumRangeMinor: ['15000', '60000'],
    description:
      'Covers shop stock, equipment, and premises against fire, theft, and business interruption.',
  },
  motorcycle: {
    id: 'motorcycle',
    name: 'Motorcycle / boda insurance',
    premiumRangeMinor: ['5000', '12000'],
    description:
      'Covers a moto used for income — accident, theft, and third-party liability cover.',
  },
  health: {
    id: 'health',
    name: 'Family health insurance',
    premiumRangeMinor: ['5000', '20000'],
    description:
      'Inpatient and outpatient cover for you and your dependents, with community-based pricing.',
  },
  life: {
    id: 'life',
    name: 'Life protection',
    premiumRangeMinor: ['3000', '10000'],
    description:
      'A safety net for your family — pays out to dependents if the main earner passes away.',
  },
}

/** Fit score when a product matches a concrete profile signal. */
const SIGNAL_SCORES: Record<InsuranceProductType, number> = {
  crop: 92,
  business: 90,
  motorcycle: 88,
  health: 85,
  life: 78,
}

/** Lower fit score when nothing specific matched (general fallback). */
const GENERAL_SCORES: Record<InsuranceProductType, number> = {
  health: 62,
  life: 55,
  crop: 38,
  business: 38,
  motorcycle: 38,
}

export function matchInsuranceProducts(profile: InsuranceProfile): RankedRecommendation[] {
  const matches: RankedRecommendation[] = []

  const text = [profile.sector, profile.occupation, profile.businessType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/(farm|crop|agri|coffee|maize|livestock)/.test(text)) {
    matches.push({ ...PRODUCTS.crop, type: 'crop', rank: matches.length + 1, reason: 'farming profile', matchScore: SIGNAL_SCORES.crop })
  }

  if (/(shop|retail|trade|business|boutique|store|vendor|sacco)/.test(text)) {
    matches.push({ ...PRODUCTS.business, type: 'business', rank: matches.length + 1, reason: 'business profile', matchScore: SIGNAL_SCORES.business })
  }

  if (profile.hasMotorcycle || /(moto|motorcycle|rider|boda|taxi)/.test(text)) {
    matches.push({ ...PRODUCTS.motorcycle, type: 'motorcycle', rank: matches.length + 1, reason: 'motorcycle profile', matchScore: SIGNAL_SCORES.motorcycle })
  }

  if ((profile.dependents ?? 0) > 0) {
    matches.push({ ...PRODUCTS.health, type: 'health', rank: matches.length + 1, reason: 'family profile', matchScore: SIGNAL_SCORES.health })
  }

  if (matches.length === 0) {
    matches.push(
      { ...PRODUCTS.health, type: 'health', rank: 1, reason: 'general profile', matchScore: GENERAL_SCORES.health },
      { ...PRODUCTS.life, type: 'life', rank: 2, reason: 'general profile', matchScore: GENERAL_SCORES.life },
    )
  }

  return matches
}
