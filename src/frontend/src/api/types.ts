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

export type CreditScoreFactors = {
  cashFlowConsistency: number
  transactionVolume: number
  repaymentHistory: number
  businessStability: number
  savingsBehavior: number
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

export type CreditScoreComputed = CreditScoreResult & {
  businessAgeMonths: number
  repayment: {
    onTimeRepayments: number
    totalRepayments: number
  }
}

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

export type CsvUploadResult = {
  accountId: string
  imported: number
  skipped: number
}

export type PlaidLinkToken = {
  link_token: string
  expiration: string
}

export type PlaidSyncResult = {
  imported: number
  cursor: string
  skipped: number
}
