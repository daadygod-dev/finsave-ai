/**
 * Canonical API types — mirror the backend contracts (src/backend/routes/*)
 * so the frontend never guesses at shapes. Money is always integer minor
 * units as strings (BigInt does not survive JSON).
 */

export type UserRole = 'individual' | 'msme_owner'

export type SessionUser = {
  id: string
  role: UserRole
}

export type SessionMe = {
  user_id: string
  role: UserRole
}

export type AccountSource = 'plaid_bank' | 'bank_csv' | 'momo_csv'

export type Account = {
  id: string
  source: AccountSource
  institution: string
  lastSyncedAt: string | null
  createdAt: string
}

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'mobile_money'
  | 'utilities'
  | 'rent'
  | 'income'
  | 'uncategorized'

export type Transaction = {
  id: string
  merchantName: string
  amountMinor: string
  currency: string
  category: string
  occurredAt: string
  account: {
    id: string
    source: AccountSource
    institution: string
  }
}

export type Summary = {
  byCategory: Array<{ category: string; amountMinor: string }>
  byMonth: Array<{ month: string; amountMinor: string }>
  byAccount: Array<{
    accountId: string
    institution: string
    source: AccountSource
    spendingMinor: string
    incomeMinor: string
  }>
}

export type SavingsGoal = {
  id: string
  name: string
  targetMinor: string
  savedMinor: string
  currency: string
  targetDate: string
  createdAt: string
  updatedAt: string
}

export type GoalFeasibility = {
  monthlyTargetMinor: string
  monthsRemaining: number
  surplusMinor: string
  feasible: boolean
  suggestion: 'ok' | 'extend_timeline' | 'reduce_target'
  suggestedMonths: number | null
}

/** Score is a FICO-style integer in [300, 850]. */
export type CreditScoreFactors = {
  /** 0–100: share of months with positive net cash flow, surplus-adjusted. */
  cashFlowConsistency: number
  /** Total ledger transaction count across all linked accounts. */
  transactionVolume: number
  /** totalExpense / totalIncome, capped at 1 (100%) — never above the ceiling. */
  expenseRatio: number
  /** Raw uncapped totalExpense / totalIncome (e.g. 1.28 = 128% of income);
   * `null` when income is zero, `0` when there is no activity. For lender
   * explainability — consumer UI keeps percentages capped at 100%. Treat
   * `null` as the worst case (spending with no income), never as "no data". */
  expenseOverrunRatio: number | null
}

export type CreditScoreResult = {
  score: number
  factors: CreditScoreFactors
  computedAt: string
}

export type CreditScoreHistoryEntry = {
  score: number
  computedAt: string
}

export type CreditScoreComputed = CreditScoreResult

export type InsuranceProductType = 'crop' | 'business' | 'motorcycle' | 'health' | 'life'

export type InsuranceRecommendation = {
  id: string
  type: InsuranceProductType
  name: string
  premiumRangeMinor: [string, string]
  description: string
  rank: number
  reason: string
  matchScore: number
}

export type CoachInsight = {
  id: string
  type: 'summary' | 'warning' | 'savings' | 'goal' | 'credit'
  title: string
  body: string
  tone: 'info' | 'success' | 'warning'
}

export type FinancialAlert = {
  id: string
  tone: 'warning' | 'info'
  title: string
  body: string
}

export type CsvUploadResult = {
  accepted: true
  jobId: string
}

export type PlaidLinkToken = {
  link_token: string
  expiration: string
}

export type PlaidSyncResult = {
  accepted: true
  jobId: string
  accountId: string
}
