import { describe, expect, it } from 'vitest'
import { hasActiveConsent } from './consent'

describe('hasActiveConsent', () => {
  const now = new Date('2026-08-03T10:00:00.000Z')

  it('fails closed when consent is missing', () => {
    expect(hasActiveConsent(null, now)).toBe(false)
  })

  it('rejects expired or revoked grants', () => {
    expect(
      hasActiveConsent(
        {
          lenderId: 'lender-1',
          businessId: 'business-1',
          expiresAt: new Date('2026-08-03T09:00:00.000Z'),
          revokedAt: null,
        },
        now,
      ),
    ).toBe(false)

    expect(
      hasActiveConsent(
        {
          lenderId: 'lender-1',
          businessId: 'business-1',
          expiresAt: new Date('2026-08-04T09:00:00.000Z'),
          revokedAt: new Date('2026-08-03T09:30:00.000Z'),
        },
        now,
      ),
    ).toBe(false)
  })
})
