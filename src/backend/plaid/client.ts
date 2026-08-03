/**
 * Thin typed client for the Plaid API (REST over fetch).
 *
 * Chosen over the official SDK to keep the MVP dependency surface small;
 * the endpoints used here are simple and stable. All credentials are read
 * server-side only and are never exposed to the frontend.
 *
 * The full set of Plaid calls is documented in AGENTS.md §13.5 — these are
 * backend-only calls, never frontend calls.
 */

export type PlaidEnvironment = 'sandbox' | 'development' | 'production'

export type PlaidConfig = {
  clientId: string
  secret: string
  env: PlaidEnvironment
  baseUrl: string
}

export function getPlaidConfig(
  env: NodeJS.ProcessEnv = process.env,
): PlaidConfig | null {
  const clientId = env.PLAID_CLIENT_ID
  const secret = env.PLAID_SECRET

  if (!clientId || !secret) return null

  const plaidEnv = (env.PLAID_ENV ?? 'sandbox') as PlaidEnvironment
  const baseUrl =
    plaidEnv === 'production'
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
        ? 'https://development.plaid.com'
        : 'https://sandbox.plaid.com'

  return { clientId, secret, env: plaidEnv, baseUrl }
}

export class PlaidApiError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'PlaidApiError'
    this.statusCode = statusCode
  }
}

export type PlaidLinkTokenResponse = {
  link_token: string
  expiration: string
}

export type PlaidExchangeResponse = {
  access_token: string
  item_id: string
  request_id: string
}

export type PlaidTransaction = {
  transaction_id: string
  name: string
  amount: number
  iso_currency_code: string
  date: string
  pending: boolean
}

export type PlaidSyncResponse = {
  added: PlaidTransaction[]
  modified: PlaidTransaction[]
  removed: Array<{ transaction_id: string }>
  next_cursor: string
  has_more: boolean
}

async function plaidRequest<T>(
  config: PlaidConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      secret: config.secret,
      ...body,
    }),
  })

  const data = (await response.json()) as Record<string, unknown>

  if (!response.ok) {
    // Never echo the raw response body — Plaid errors can include request
    // metadata we don't want logged. Surface only the code.
    const code = typeof data.error_code === 'string' ? data.error_code : `http_${response.status}`
    throw new PlaidApiError(`plaid_error:${code}`, response.status)
  }

  return data as T
}

export function createLinkToken(
  config: PlaidConfig,
  userClientId: string,
): Promise<PlaidLinkTokenResponse> {
  return plaidRequest<PlaidLinkTokenResponse>(config, '/link/token/create', {
    client_name: 'FinSave AI',
    language: 'en',
    // Sandbox institutions (e.g. First Platypus Bank) are US-based — Rwanda
    // production institutions are not yet covered by Plaid, which is why the
    // MVP's real-world MoMo path is CSV upload (see AGENTS.md §3).
    country_codes: ['US'],
    products: ['transactions'],
    user: { client_user_id: userClientId },
  })
}

export function exchangePublicToken(
  config: PlaidConfig,
  publicToken: string,
): Promise<PlaidExchangeResponse> {
  return plaidRequest<PlaidExchangeResponse>(config, '/item/public_token/exchange', {
    public_token: publicToken,
  })
}

export function syncTransactions(
  config: PlaidConfig,
  accessToken: string,
  cursor?: string,
): Promise<PlaidSyncResponse> {
  return plaidRequest<PlaidSyncResponse>(config, '/transactions/sync', {
    access_token: accessToken,
    ...(cursor ? { cursor } : {}),
  })
}

export function createSandboxTransaction(
  config: PlaidConfig,
  accessToken: string,
  transaction: { date: string; name: string; amount: number },
): Promise<unknown> {
  return plaidRequest(config, '/sandbox/transactions/create', {
    access_token: accessToken,
    transaction,
  })
}

/**
 * Sandbox-only normalization. Plaid sandbox institutions report amounts in
 * USD; the product surfaces everything in RWF for the demo, so the demo
 * narrative stays internally consistent (see build plan §12.3). Outside
 * sandbox, amounts pass through unchanged.
 */
export function plaidAmountToRwfMinor(amountUsd: number, plaidEnv: PlaidEnvironment): bigint {
  const multiplier = plaidEnv === 'sandbox' ? 1300 : 1
  return BigInt(Math.round(amountUsd * multiplier))
}
