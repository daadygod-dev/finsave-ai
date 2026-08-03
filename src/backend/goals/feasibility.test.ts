import { describe, expect, it } from 'vitest'
import { computeGoalFeasibility } from './feasibility'

const now = new Date('2026-08-03T10:00:00.000Z')

describe('computeGoalFeasibility', () => {
  it('accepts a realistic timeline within the monthly surplus', () => {
    const result = computeGoalFeasibility(
      {
        targetMinor: 600000,
        savedMinor: 0,
        targetDate: new Date('2027-01-30T10:00:00.000Z'), // exactly 6 x 30-day months
        avgMonthlyIncomeMinor: 400000,
        avgMonthlyEssentialSpendingMinor: 250000, // surplus 150,000
      },
      now,
    )

    expect(result.feasible).toBe(true)
    expect(result.monthsRemaining).toBe(6)
    expect(result.monthlyTargetMinor).toBe('100000') // 600,000 / 6
    expect(result.suggestion).toBe('ok')
  })

  it('warns and suggests an extended timeline for an unrealistic one', () => {
    const result = computeGoalFeasibility(
      {
        targetMinor: 600000,
        savedMinor: 0,
        targetDate: new Date('2026-10-02T10:00:00.000Z'), // exactly 2 x 30-day months
        avgMonthlyIncomeMinor: 400000,
        avgMonthlyEssentialSpendingMinor: 350000, // surplus 50,000
      },
      now,
    )

    expect(result.feasible).toBe(false)
    expect(result.monthsRemaining).toBe(2)
    expect(result.monthlyTargetMinor).toBe('300000') // needs 300,000/mo
    expect(result.suggestion).toBe('extend_timeline')
    expect(result.suggestedMonths).toBeGreaterThan(2) // 12 months at surplus
  })

  it('suggests reducing the target when there is no monthly surplus', () => {
    const result = computeGoalFeasibility(
      {
        targetMinor: 100000,
        savedMinor: 0,
        targetDate: new Date('2026-12-03T00:00:00.000Z'),
        avgMonthlyIncomeMinor: 200000,
        avgMonthlyEssentialSpendingMinor: 200000, // surplus 0
      },
      now,
    )

    expect(result.feasible).toBe(false)
    expect(result.suggestion).toBe('reduce_target')
    expect(result.surplusMinor).toBe('0')
  })
})
