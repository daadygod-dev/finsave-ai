import { describe, expect, it } from 'vitest'
import { computeCreditScore } from './scoring'

describe('computeCreditScore', () => {
  it('produces a stronger score for stable, high-volume repayment behavior', () => {
    const result = computeCreditScore({
      businessAgeMonths: 30,
      onTimeRepayments: 12,
      totalRepayments: 12,
      transactions: [
        { accountId: 'bank', amountMinor: 900000, occurredAt: new Date('2026-01-05') },
        { accountId: 'bank', amountMinor: -500000, occurredAt: new Date('2026-01-12') },
        { accountId: 'momo', amountMinor: 650000, occurredAt: new Date('2026-02-05') },
        { accountId: 'momo', amountMinor: -350000, occurredAt: new Date('2026-02-12') },
        { accountId: 'bank', amountMinor: 800000, occurredAt: new Date('2026-03-05') },
        { accountId: 'momo', amountMinor: -300000, occurredAt: new Date('2026-03-12') },
      ],
    })

    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.factors.cashFlowConsistency).toBe(100)
  })

  it('aggregates transactions across all linked accounts', () => {
    const result = computeCreditScore({
      businessAgeMonths: 18,
      onTimeRepayments: 3,
      totalRepayments: 4,
      transactions: [
        { accountId: 'bank', amountMinor: 250000, occurredAt: new Date('2026-01-03') },
        { accountId: 'momo', amountMinor: 250000, occurredAt: new Date('2026-01-20') },
        { accountId: 'momo', amountMinor: -100000, occurredAt: new Date('2026-01-25') },
      ],
    })

    expect(result.factors.transactionVolume).toBe(15)
    expect(result.score).toBeGreaterThan(50)
  })
})
