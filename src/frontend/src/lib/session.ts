/**
 * Access-token bridge for the API client.
 *
 * Supabase owns the real session: it persists it (localStorage) and refreshes
 * it automatically. This module only hands the current access token to the
 * fetch layer so the backend can verify it. There is no simulated session
 * here — an absent token simply means unauthenticated requests.
 */
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}
