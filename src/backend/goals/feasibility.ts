/**
 * Savings goal feasibility (build plan §6.2):
 *
 *   monthly_target = (goal - saved) / months_remaining
 *   feasible = monthly_target <= avg_monthly_surplus
 *
 * When infeasible, suggest either an extended timeline (at the current
 * surplus) or a reduced target (when there is no surplus at all). The
 * feasibility warning is returned with goal creation rather than silently
 * accepted — Phase 3 verification requirement.
 */
import { Decimal } from 'decimal.js'

export type FeasibilityInput = {
  // Amounts accept bigint, number, or the decimal-string form used by the
  // API layer (BigInt does not survive JSON serialization).
  targetMinor: bigint | number | string
  savedMinor: bigint | number | string
  targetDate: Date
  avgMonthlyIncomeMinor: bigint | number | string
  avgMonthlyEssentialSpendingMinor: bigint | number | string
}

export type FeasibilityResult = {
  monthlyTargetMinor: string
  monthsRemaining: number
  surplusMinor: string
  feasible: boolean
  suggestion: 'ok' | 'extend_timeline' | 'reduce_target'
  suggestedMonths: number | null
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const DAYS_PER_MONTH = 30

export function computeGoalFeasibility(
  input: FeasibilityInput,
  now: Date = new Date(),
): FeasibilityResult {
  const remaining = new Decimal(input.targetMinor.toString()).minus(
    input.savedMinor.toString(),
  )
  const monthsRemaining = Math.max(
    1,
    Math.ceil((input.targetDate.getTime() - now.getTime()) / (MS_PER_DAY * DAYS_PER_MONTH)),
  )
  const monthlyTarget = remaining.dividedBy(monthsRemaining)
  const surplus = new Decimal(input.avgMonthlyIncomeMinor.toString()).minus(
    input.avgMonthlyEssentialSpendingMinor.toString(),
  )
  const feasible = monthlyTarget.lte(surplus)

  let suggestion: FeasibilityResult['suggestion'] = 'ok'
  let suggestedMonths: number | null = null

  if (!feasible) {
    if (surplus.gt(0)) {
      suggestion = 'extend_timeline'
      suggestedMonths = Math.max(
        monthsRemaining + 1,
        Math.ceil(remaining.dividedBy(surplus).toNumber()),
      )
    } else {
      suggestion = 'reduce_target'
    }
  }

  return {
    monthlyTargetMinor: monthlyTarget.toFixed(0),
    monthsRemaining,
    surplusMinor: surplus.toFixed(0),
    feasible,
    suggestion,
    suggestedMonths,
  }
}
