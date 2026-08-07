/**
 * Shared credit-score display metadata.
 *
 * The backend stores four factors in `factorsJson`: the three displayed
 * below plus `expenseOverrunRatio` (the raw, uncapped expense-to-income
 * magnitude, kept for lender explainability and deliberately NOT shown in
 * the consumer UI, which caps percentages at 100%). The score is a
 * FICO-style [300, 850] integer. Every factor here is normalized to a
 * "higher is better, 0–100" display value so bars and strength/focus
 * thresholds stay uniform across pages.
 */
import type { CreditScoreFactors } from '../api/types'

export const CREDIT_MIN_SCORE = 300
export const CREDIT_MAX_SCORE = 850

export const SCORE_BANDS = [
  { label: 'Strong', min: 720, tone: 'text-palm' },
  { label: 'Good', min: 640, tone: 'text-brand' },
  { label: 'Fair', min: 540, tone: 'text-maize' },
  { label: 'Building', min: CREDIT_MIN_SCORE, tone: 'text-brick' },
]

export function scoreBand(score: number) {
  return SCORE_BANDS.find((band) => score >= band.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
}

/**
 * Maps the FICO-style [300, 850] integer score onto a strict 0–100 layout
 * percentage: scoreSpan = 850 - 300 = 550, so 300 -> 0% and 850 -> 100%.
 * Out-of-range values are clamped by clampPercent (below-300 scores render
 * as an empty track, above-850 as a full one). This is the ONLY value that
 * may drive the global-score progress track — the raw integer stays in the
 * number column and never reaches a width utility.
 */
export function scoreToPercent(score: number): number {
  const scoreSpan = CREDIT_MAX_SCORE - CREDIT_MIN_SCORE
  return clampPercent(((score - CREDIT_MIN_SCORE) / scoreSpan) * 100)
}

/** The factors surfaced in the consumer UI (expenseOverrunRatio is stored
 * for lender use but not displayed, so it is intentionally absent here). */
export const FACTOR_KEYS = [
  'cashFlowConsistency',
  'transactionVolume',
  'expenseRatio',
] as const

export type FactorKey = (typeof FACTOR_KEYS)[number]

export type FactorMeta = {
  label: string
  /** Normalized 0–100 display value (higher is better) — ALWAYS a strict
   * percentage, never the raw metric. Progress bars derive their width from
   * this value, so it must stay inside [0, 100]. */
  display: (factors: CreditScoreFactors) => number
  /** Human-readable raw value, e.g. "154 transactions" — the descriptive
   * text column, kept separate from the bar width. */
  raw: (factors: CreditScoreFactors) => string
  positive: string
  improve: string
}

/** Strict 0–100 clamp for any value about to feed a progress-bar width. */
function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

/**
 * Transaction count that saturates the volume bar at 100% — the standard
 * high-activity business ceiling (liveVolume / targetBenchmark * 100).
 * Mirrors the backend volume score (transactionVolume / 200 * 100, full at
 * 200), so the bar and the factor's scoring contribution agree.
 */
const TRANSACTION_VOLUME_BENCHMARK = 200

export const FACTOR_META: Record<FactorKey, FactorMeta> = {
  cashFlowConsistency: {
    label: 'Cash flow consistency',
    display: (factors) => clampPercent(factors.cashFlowConsistency),
    raw: (factors) => `${factors.cashFlowConsistency}/100`,
    positive: 'Stable income — consistent cash flow strengthens repayment capacity.',
    improve: 'Irregular cash flow — smoother income months lift this fastest.',
  },
  transactionVolume: {
    label: 'Transaction volume',
    // The raw count (e.g. 154) is normalized to a strict 0–100 percentage
    // against the benchmark BEFORE any layout width is derived — the raw
    // number never reaches the progress element.
    display: (factors) =>
      clampPercent((factors.transactionVolume / TRANSACTION_VOLUME_BENCHMARK) * 100),
    raw: (factors) => `${factors.transactionVolume} transactions`,
    positive: 'Active transaction volume — regular activity shows a live business.',
    improve: 'Low transaction activity — recording more business transactions helps.',
  },
  expenseRatio: {
    label: 'Expense-to-income ratio',
    // Clamped to [0, 100] so a ratio > 1 (expenses outrun income) renders as
    // an empty bar rather than a negative width.
    display: (factors) => clampPercent((1 - factors.expenseRatio) * 100),
    // Capped at 100% so a legacy ratio above 1 never reads as "128% of income".
    raw: (factors) => `${Math.min(100, Math.round(factors.expenseRatio * 100))}% of income`,
    positive: 'Healthy expense ratio — spending stays well under income.',
    improve: 'Expenses absorb a large share of income — trimming spending lifts this fastest.',
  },
}
