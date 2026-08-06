/**
 * Typed endpoint surface for the FinSave AI backend.
 * One function per backend route — feature code never calls fetch directly.
 */
import { requestJson } from './client'
import type {
  Account,
  CoachInsight,
  FinancialAlert,
  CreditScoreComputed,
  CreditScoreHistoryEntry,
  CreditScoreResult,
  CsvUploadResult,
  GoalFeasibility,
  InsuranceRecommendation,
  PlaidLinkToken,
  PlaidSyncResult,
  SavingsGoal,
  SessionMe,
  Summary,
  Transaction,
  TransactionCategory,
  UserRole,
} from './types'

export const api = {
  health: () => requestJson<{ ok: boolean; service: string }>('/healthz'),

  auth: {
    /**
     * Provision the Prisma User row after a Supabase signup. The role is
     * read by the backend from the verified token's user_metadata, so no
     * client-supplied role is required.
     */
    register: () =>
      requestJson<{ user: { id: string; email: string; role: UserRole } }>(
        '/api/v1/auth/register',
        { method: 'POST', body: {} },
      ),
  },

  session: {
    me: () => requestJson<SessionMe>('/api/v1/session/me'),
  },

  accounts: () => requestJson<{ accounts: Account[] }>('/api/v1/accounts'),

  transactions: (options?: {
    accountId?: string
    from?: string
    to?: string
    limit?: number
  }) => {
    const params = new URLSearchParams()
    params.set('limit', String(options?.limit ?? 50))
    if (options?.accountId) params.set('account_id', options.accountId)
    if (options?.from) params.set('from', options.from)
    if (options?.to) params.set('to', options.to)
    return requestJson<{ transactions: Transaction[] }>(`/api/v1/transactions?${params.toString()}`)
  },

  summarize: (accountId?: string) =>
    requestJson<Summary>(
      `/api/v1/spending/summary${accountId ? `?account_id=${encodeURIComponent(accountId)}` : ''}`,
    ),

  alerts: () => requestJson<{ alerts: FinancialAlert[] }>('/api/v1/alerts'),

  uploadCsv: (body: { source: 'bank_csv' | 'momo_csv'; institution: string; csv: string }) =>
    requestJson<CsvUploadResult>('/api/v1/csv/upload', { method: 'POST', body }),

  categorize: (id: string, category: TransactionCategory) =>
    requestJson<{ transaction: { id: string; category: string } }>(
      `/api/v1/transactions/${id}/categorize`,
      { method: 'POST', body: { category } },
    ),

  goals: {
    list: () =>
      requestJson<{ goals: SavingsGoal[]; feasibility: Record<string, GoalFeasibility> }>(
        '/api/v1/goals',
      ),
    create: (body: { name: string; target_minor: string; target_date: string }) =>
      requestJson<{ goal: SavingsGoal; feasibility: GoalFeasibility }>('/api/v1/goals', {
        method: 'POST',
        body,
      }),
    update: (
      id: string,
      body: {
        name?: string
        target_minor?: string
        saved_minor?: string
        target_date?: string
      },
    ) =>
      requestJson<{ goal: SavingsGoal }>(`/api/v1/goals/${id}`, {
        method: 'PATCH',
        body,
      }),
    remove: (id: string) => requestJson<void>(`/api/v1/goals/${id}`, { method: 'DELETE' }),
  },

  creditScore: {
    get: () => requestJson<CreditScoreResult>('/api/v1/credit-score'),
    history: () =>
      requestJson<{ history: CreditScoreHistoryEntry[] }>('/api/v1/credit-score/history'),
    compute: (body?: {
      business_age_months?: number
      on_time_repayments?: number
      total_repayments?: number
    }) =>
      requestJson<CreditScoreComputed>('/api/v1/credit-score/compute', {
        method: 'POST',
        body: body ?? {},
      }),
  },

  insurance: {
    recommendations: (params?: {
      sector?: string
      occupation?: string
      business_type?: string
      has_motorcycle?: boolean
      dependents?: number
    }) =>
      requestJson<{ recommendations: InsuranceRecommendation[] }>(
        `/api/v1/insurance/recommendations${toQueryString(params ?? {})}`,
      ),
  },

  coach: {
    insights: () =>
      requestJson<{ insights: CoachInsight[]; generatedAt: string }>('/api/v1/coach/insights', {
        method: 'POST',
        body: {},
      }),
  },

  plaid: {
    createLinkToken: () =>
      requestJson<PlaidLinkToken>('/api/v1/plaid/create-link-token', { method: 'POST' }),
    exchangeToken: (body: { public_token: string; institution: string }) =>
      requestJson<{ account: Account }>('/api/v1/plaid/exchange-token', {
        method: 'POST',
        body,
      }),
    syncTransactions: (accountId: string) =>
      requestJson<PlaidSyncResult>('/api/v1/plaid/sync-transactions', {
        method: 'POST',
        body: { account_id: accountId },
      }),
  },
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  )

  if (entries.length === 0) return ''

  const query = new URLSearchParams(
    entries.map(([key, value]) => [key, String(value)]),
  ).toString()

  return `?${query}`
}
