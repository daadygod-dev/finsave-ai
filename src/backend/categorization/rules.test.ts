import { describe, expect, it } from 'vitest'
import { categorizeTransaction } from './rules'

describe('categorizeTransaction', () => {
  it('categorizes known mobile money merchants deterministically', () => {
    expect(
      categorizeTransaction({
        merchantName: 'MTN MoMo Merchant Payment',
        amountMinor: -125000,
      }),
    ).toMatchObject({
      category: 'mobile_money',
      confidence: 0.95,
    })
  })

  it('leaves unknown merchants for fallback handling', () => {
    expect(
      categorizeTransaction({
        merchantName: 'Kigali Vendor 48391',
        amountMinor: -50000,
      }).category,
    ).toBe('uncategorized')
  })
})
