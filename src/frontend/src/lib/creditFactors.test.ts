import { describe, expect, it } from 'vitest'
import {
  CREDIT_MAX_SCORE,
  CREDIT_MIN_SCORE,
  FACTOR_KEYS,
  FACTOR_META,
  scoreToPercent,
} from './creditFactors'
import type { CreditScoreFactors } from '../api/types'

describe('credit factor display normalization', () => {
  it('never lets the raw transaction count escape as a percentage width', () => {
    const factors: CreditScoreFactors = {
      cashFlowConsistency: 80,
      transactionVolume: 154,
      expenseRatio: 0.3,
      expenseOverrunRatio: 0.3,
    }

    const display = FACTOR_META.transactionVolume.display(factors)

    // The bar width comes from display only: 154 transactions saturates at
    // 77% against the 200-transaction high-activity benchmark — never a
    // raw 154% width.
    expect(display).toBe(77)
    // The raw descriptive text stays intact in the label metadata column.
    expect(FACTOR_META.transactionVolume.raw(factors)).toBe('154 transactions')
  })

  it('normalizes volume proportionally against the 200 benchmark', () => {
    const factors: CreditScoreFactors = {
      cashFlowConsistency: 0,
      transactionVolume: 10,
      expenseRatio: 0,
      expenseOverrunRatio: 0,
    }

    expect(FACTOR_META.transactionVolume.display(factors)).toBe(5)
    expect(FACTOR_META.transactionVolume.raw(factors)).toBe('10 transactions')
  })

  it('saturates at 100% only at the 200-transaction high-activity ceiling', () => {
    const factors: CreditScoreFactors = {
      cashFlowConsistency: 0,
      transactionVolume: 200,
      expenseRatio: 0,
      expenseOverrunRatio: 0,
    }

    expect(FACTOR_META.transactionVolume.display(factors)).toBe(100)
  })

  it('caps the raw expense-ratio text at 100% for legacy overrun rows', () => {
    const factors: CreditScoreFactors = {
      cashFlowConsistency: 0,
      transactionVolume: 5,
      expenseRatio: 1.28, // legacy row storing an uncapped ratio
      expenseOverrunRatio: 1.28,
    }

    expect(FACTOR_META.expenseRatio.raw(factors)).toBe('100% of income')
    expect(FACTOR_META.expenseRatio.display(factors)).toBe(0)
  })

  it('clamps every factor display into [0, 100] for extreme raw inputs', () => {
    const extremes: CreditScoreFactors[] = [
      {
        cashFlowConsistency: 120, // impossible raw value — must clamp down
        transactionVolume: 10_000,
        expenseRatio: 1.5, // expenses outrun income — must clamp to empty bar
        expenseOverrunRatio: 1.5,
      },
      {
        cashFlowConsistency: -20, // impossible raw value — must clamp up
        transactionVolume: 0,
        expenseRatio: -0.4, // impossible raw value — must clamp to full bar
        expenseOverrunRatio: 0,
      },
      {
        cashFlowConsistency: 64,
        transactionVolume: 4,
        expenseRatio: 0.5,
        expenseOverrunRatio: 0.5,
      },
    ]

    for (const factors of extremes) {
      for (const key of FACTOR_KEYS) {
        const value = FACTOR_META[key].display(factors)
        expect(Number.isInteger(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('scoreToPercent', () => {
  it('maps the [300, 850] integer scale onto a strict 0–100 percentage', () => {
    expect(scoreToPercent(CREDIT_MIN_SCORE)).toBe(0) // 300 -> 0%
    expect(scoreToPercent(575)).toBe(50) // midpoint of the 550 span
    expect(scoreToPercent(CREDIT_MAX_SCORE)).toBe(100) // 850 -> 100%
    // e.g. 640 -> (640-300)/550 = 61.8% -> 62 (integer, in range)
    expect(scoreToPercent(640)).toBe(62)
  })

  it('clamps out-of-range scores into [0, 100]', () => {
    expect(scoreToPercent(250)).toBe(0) // below the floor
    expect(scoreToPercent(900)).toBe(100) // above the ceiling
    expect(Number.isInteger(scoreToPercent(732))).toBe(true)
  })
})
