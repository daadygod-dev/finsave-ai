import { ApiError } from '../api/client'

/**
 * Map a backend ApiError to a message the user can act on, instead of a
 * generic guess. Falls back to the supplied message for unknown failures.
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    return 'The backend is unreachable. Start it with `npm run dev:api` and try again.'
  }

  if (error instanceof ApiError) {
    switch (error.code) {
      case 'network_error':
        return 'The backend is unreachable. Start it with `npm run dev:api` and try again.'
      case 'plaid_not_configured':
        return 'Plaid is not fully configured on the server — the token encryption key (TOKEN_ENCRYPTION_KEY) is missing from the backend environment.'
      case 'no_valid_transactions':
        return 'No valid rows were found in the CSV. Expected columns: date, merchant, amount (a reference column is accepted too).'
      case 'validation_error':
        return 'The request was rejected — check the statement type and institution name.'
      case 'internal_error':
        return 'The server hit an internal error saving this. Check the server logs, then try again.'
      default:
        return `The backend rejected the request (${error.code}).`
    }
  }

  return fallback
}
