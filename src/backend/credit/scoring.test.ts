import { describe, expect, it } from 'vitest'
import { computeCreditScore, MAX_SCORE, MIN_SCORE } from './scoring'
import type { ScoreInput } from './scoring'

describe('computeCreditScore', () => {
  it('scores a stable, high-surplus business high (bank + MoMo combined)', () => {
    const result = computeCreditScore({
      transactions: [
        { accountId: 'bank', amountMinor: 1_000_000, occurredAt: new Date('2026-01-05') },
        { accountId: 'bank', amountMinor: -300_000, occurredAt: new Date('2026-01-12') },
        { accountId: 'momo', amountMinor: 900_000, occurredAt: new Date('2026-02-05') },
        { accountId: 'momo', amountMinor: -250_000, occurredAt: new Date('2026-02-12') },
        { accountId: 'bank', amountMinor: 1_100_000, occurredAt: new Date('2026-03-05') },
        { accountId: 'bank', amountMinor: -350_000, occurredAt: new Date('2026-03-12') },
        { accountId: 'momo', amountMinor: 950_000, occurredAt: new Date('2026-04-05') },
        { accountId: 'momo', amountMinor: -200_000, occurredAt: new Date('2026-04-12') },
      ],
    })

    expect(result.score).toBeGreaterThan(650)
    expect(result.factors.cashFlowConsistency).toBe(100)
    expect(result.factors.transactionVolume).toBe(8)
    expect(result.factors.expenseRatio).toBe(0.28)
    expect(result.factors.expenseOverrunRatio).toBe(0.28)
  })

  it('scores a business whose expenses drain revenue low', () => {
    const result = computeCreditScore({
      transactions: [
        { accountId: 'bank', amountMinor: 500_000, occurredAt: new Date('2026-01-05') },
        { accountId: 'bank', amountMinor: -600_000, occurredAt: new Date('2026-01-12') },
        { accountId: 'momo', amountMinor: 400_000, occurredAt: new Date('2026-02-05') },
        { accountId: 'momo', amountMinor: -550_000, occurredAt: new Date('2026-02-12') },
      ],
    })

    expect(result.score).toBeLessThan(500)
    expect(result.factors.cashFlowConsistency).toBe(0)
    // True ratio is 1.28 (128%) but the display factor is capped at 100%;
    // the raw overrun magnitude is preserved separately for lender use.
    expect(result.factors.expenseRatio).toBe(1)
    expect(result.factors.expenseOverrunRatio).toBe(1.28)
  })

  it('scores a pure-income business strongly', () => {
    const result = computeCreditScore({
      transactions: [
        { accountId: 'bank', amountMinor: 1_000_000, occurredAt: new Date('2026-01-05') },
        { accountId: 'momo', amountMinor: 1_000_000, occurredAt: new Date('2026-02-05') },
        { accountId: 'bank', amountMinor: 1_000_000, occurredAt: new Date('2026-03-05') },
      ],
    })

    expect(result.score).toBeGreaterThan(700)
    expect(result.factors.expenseRatio).toBe(0)
    expect(result.factors.expenseOverrunRatio).toBe(0)
  })

  it('does not reward a business that spends with no income', () => {
    const result = computeCreditScore({
      transactions: [
        { accountId: 'bank', amountMinor: -500_000, occurredAt: new Date('2026-01-05') },
        { accountId: 'momo', amountMinor: -300_000, occurredAt: new Date('2026-01-12') },
      ],
    })

    expect(result.score).toBeLessThan(500)
    expect(result.factors.expenseRatio).toBe(1)
    expect(result.factors.expenseOverrunRatio).toBeNull()
    expect(result.factors.cashFlowConsistency).toBe(0)
  })

  it('returns the minimum score with no ledger activity', () => {
    const result = computeCreditScore({ transactions: [] })

    expect(result.score).toBe(MIN_SCORE)
    expect(result.factors).toEqual({
      cashFlowConsistency: 0,
      transactionVolume: 0,
      expenseRatio: 0,
      expenseOverrunRatio: 0,
    })
  })

  it('aggregates across all linked accounts (bank + MoMo beat bank alone)', () => {
    const bankOnly = computeCreditScore({
      transactions: [
        { accountId: 'bank', amountMinor: 1_000_000, occurredAt: new Date('2026-01-05') },
        { accountId: 'bank', amountMinor: -300_000, occurredAt: new Date('2026-01-12') },
      ],
    })

    const combined = computeCreditScore({
      transactions: [
        { accountId: 'bank', amountMinor: 1_000_000, occurredAt: new Date('2026-01-05') },
        { accountId: 'bank', amountMinor: -300_000, occurredAt: new Date('2026-01-12') },
        { accountId: 'momo', amountMinor: 1_100_000, occurredAt: new Date('2026-02-05') },
        { accountId: 'momo', amountMinor: -200_000, occurredAt: new Date('2026-02-12') },
        { accountId: 'momo', amountMinor: 950_000, occurredAt: new Date('2026-03-05') },
      ],
    })

    expect(combined.score).toBeGreaterThan(bankOnly.score)
    expect(combined.factors.transactionVolume).toBe(5)
  })

  it('always maps to an integer within [300, 850]', () => {
    const cases: ScoreInput[] = [
      { transactions: [] },
      { transactions: [{ accountId: 'a', amountMinor: -1n, occurredAt: new Date('2026-01-01') }] },
      {
        transactions: [
          { accountId: 'a', amountMinor: '500000', occurredAt: new Date('2026-01-01') },
          { accountId: 'b', amountMinor: 250000n, occurredAt: new Date('2026-02-01') },
          { accountId: 'a', amountMinor: -750000, occurredAt: new Date('2026-02-10') },
        ],
      },
      {
        transactions: Array.from({ length: 40 }, (_, i) => ({
          accountId: i % 2 === 0 ? 'bank' : 'momo',
          amountMinor: (i % 3 === 0 ? 200_000 : -80_000) * (i + 1),
          occurredAt: new Date(`2026-${String((i % 12) + 1).padStart(2, '0')}-15`),
        })),
      },
    ]

    for (const input of cases) {
      const result = computeCreditScore(input)
      expect(Number.isInteger(result.score)).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(MIN_SCORE)
      expect(result.score).toBeLessThanOrEqual(MAX_SCORE)
      expect(result.factors).toHaveProperty('cashFlowConsistency')
      expect(result.factors).toHaveProperty('transactionVolume')
      // The stored expense ratio is a percentage-capped metric: never below
      // 0, never above 1 (100%).
      expect(result.factors.expenseRatio).toBeGreaterThanOrEqual(0)
      expect(result.factors.expenseRatio).toBeLessThanOrEqual(1)
      // The raw overrun magnitude is never negative; it is null only when
      // income is zero.
      if (result.factors.expenseOverrunRatio !== null) {
        expect(result.factors.expenseOverrunRatio).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
