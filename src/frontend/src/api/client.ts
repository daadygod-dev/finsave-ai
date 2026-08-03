/**
 * Low-level HTTP client for the FinSave AI backend.
 *
 * Attaches the current Supabase session as a Bearer token, normalizes
 * failures into ApiError, and parses the backend's `{ error }` envelope.
 */
import { getAccessToken } from '../lib/session'

const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type FetchOptions = {
  method?: string
  body?: unknown
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function requestJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    let code = `http_${response.status}`
    try {
      const body = (await response.json()) as { error?: unknown }
      if (typeof body.error === 'string' && body.error.length > 0) code = body.error
    } catch {
      // Non-JSON error body — fall back to the status code.
    }
    throw new ApiError(response.status, code)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}
