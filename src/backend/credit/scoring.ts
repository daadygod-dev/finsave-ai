import { Decimal } from 'decimal.js'

/**
 * Data-driven credit scoring engine.
 *
 * Every input comes from the business's real ledger — transactions across
 * ALL linked accounts (bank + MoMo) — never from hardcoded placeholders.
 * The engine aggregates income and expenses, derives a net surplus, and
 * maps the resulting ratios to a FICO-style integer score in [300, 850].
 */

export const MIN_SCORE = 300
export const MAX_SCORE = 850

export type ScoreTransaction = {
  accountId: string
  /** Integer minor units: Prisma BigInt, the decimal-string form used by the
   * API layer (BigInt does not survive JSON), or a plain number in tests. */
  amountMinor: bigint | number | string
  occurredAt: Date
}

export type ScoreInput = {
  transactions: ScoreTransaction[]
}

/**
 * Schema-compliant factor payload — stored verbatim in `factorsJson`:
 *   { "cashFlowConsistency": consistencyScore,
 *     "transactionVolume": totalTransactionsCount,
 *     "expenseRatio": calculatedRatio,
 *     "expenseOverrunRatio": rawUncappedRatio }
 */
export type CreditScoreFactors = {
  /** 0–100: share of months with positive net cash flow, surplus-adjusted. */
  cashFlowConsistency: number
  /** Total count of ledger transactions across all accounts. */
  transactionVolume: number
  /** totalExpense / totalIncome, capped at 1 (100%) — expenses outrunning
   * income is recorded as the worst case, never above 100%. */
  expenseRatio: number
  /** Raw (uncapped) totalExpense / totalIncome, e.g. 1.28 means expenses were
   * 128% of income. Stored for lender explainability — consumer-facing
   * percentages stay capped at 100%. `null` when income is zero (the ratio
   * is undefined), `0` when there is no activity at all.
   *
   * LENDER CONSUMERS: treat `null` as the WORST case — a business spending
   * with no recorded income — never filter it out of "expenses exceeded
   * income" queries. */
  expenseOverrunRatio: number | null
}

export type CreditScoreResult = {
  /** Final integer credit score in [300, 850] — never a raw ratio or string. */
  score: number
  factors: CreditScoreFactors
}

export function computeCreditScore(input: ScoreInput): CreditScoreResult {
  const monthlyNet = new Map<string, Decimal>()
  let totalIncome = new Decimal(0)
  let totalExpense = new Decimal(0)

  for (const transaction of input.transactions) {
    // String() normalizes every accepted amount form (900000n -> "900000")
    // into exact decimal input for Decimal.js — never a raw float.
    const amount = new Decimal(String(transaction.amountMinor))
    const monthKey = transaction.occurredAt.toISOString().slice(0, 7)
    monthlyNet.set(monthKey, (monthlyNet.get(monthKey) ?? new Decimal(0)).plus(amount))

    if (amount.isPositive()) {
      totalIncome = totalIncome.plus(amount)
    } else {
      totalExpense = totalExpense.plus(amount.abs())
    }
  }

  const netSurplus = totalIncome.minus(totalExpense)

  // Ratios are stored rounded to 2 decimals and capped at 1 (100%) — a
  // ratio above 100% would misread as a percentage past the ceiling, and the
  // scoring already treats anything >= 100% as the worst case. Division is
  // guarded so a business with no income never divides by zero. Spending
  // with NO income is the worst case (ratio 1, negative surplus) — it must
  // never read as a healthy 0% expense ratio.
  const expenseRatio =
    totalIncome.isZero()
      ? (totalExpense.greaterThan(0) ? 1 : 0)
      : Math.min(1, Number(totalExpense.dividedBy(totalIncome).toDecimalPlaces(2)))
  // The uncapped magnitude (e.g. 1.28) is preserved separately so a lender
  // can say "expenses were 128% of income" — the capped field above never
  // exceeds 100%, but the overrun data is not discarded.
  const expenseOverrunRatio =
    totalIncome.isZero()
      ? (totalExpense.greaterThan(0) ? null : 0)
      : Number(totalExpense.dividedBy(totalIncome).toDecimalPlaces(2))
  const surplusRatio =
    totalIncome.isZero()
      ? (totalExpense.greaterThan(0) ? -1 : 0)
      : Number(netSurplus.dividedBy(totalIncome).toDecimalPlaces(2))

  // --- Cash flow consistency (0–100) ---------------------------------------
  // Base: share of months with positive net cash flow. Then adjust by the
  // surplus ratio — a healthy surplus pushes the rating up; expenses that
  // drain incoming revenue pull it down.
  const months = Math.max(monthlyNet.size, 1)
  let positiveMonths = 0
  for (const net of monthlyNet.values()) {
    if (net.isPositive()) positiveMonths += 1
  }

  let cashFlowConsistency = Math.round((positiveMonths / months) * 100)
  if (surplusRatio >= 0.3) cashFlowConsistency += 10
  else if (surplusRatio >= 0.1) cashFlowConsistency += 5
  else if (surplusRatio < -0.2) cashFlowConsistency -= 25
  else if (surplusRatio < 0) cashFlowConsistency -= 15
  cashFlowConsistency = clamp(cashFlowConsistency, 0, 100)

  // --- Transaction volume ----------------------------------------------------
  // Stored as the raw count (schema spec); scoring uses a scaled 0–100
  // component against the same 200-transaction benchmark the UI renders
  // with, so ~200 transactions read as full activity. This scale MUST stay
  // in sync with TRANSACTION_VOLUME_BENCHMARK (= 200) in
  // src/frontend/src/lib/creditFactors.ts, which renders the same factor.
  const transactionVolume = input.transactions.length
  const volumeScore = clamp(Math.round((transactionVolume / 200) * 100), 0, 100)

  // --- Expense ratio (0–100, lower spend share scores higher) ----------------
  // No ledger activity at all gets no credit for a favorable ratio — the
  // score should not reward a lack of evidence.
  const hasActivity = totalIncome.greaterThan(0) || totalExpense.greaterThan(0)
  const expenseScore = hasActivity
    ? clamp(Math.round((1 - expenseRatio) * 100), 0, 100)
    : 0

  // --- Combine and map to [300, 850] ----------------------------------------
  const combined = Math.round(
    cashFlowConsistency * 0.4 +
      volumeScore * 0.2 +
      expenseScore * 0.4,
  )

  const score = clamp(
    MIN_SCORE + Math.round((combined / 100) * (MAX_SCORE - MIN_SCORE)),
    MIN_SCORE,
    MAX_SCORE,
  )

  return {
    score,
    factors: {
      cashFlowConsistency,
      transactionVolume,
      expenseRatio,
      expenseOverrunRatio,
    },
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
