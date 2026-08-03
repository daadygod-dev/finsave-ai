/**
 * Plaid Link launcher.
 *
 * Loads the Plaid Link web SDK from the official CDN at runtime (no npm
 * dependency), asks the backend for a link token, and opens the widget.
 * The backend exchange + sync are the caller's responsibility.
 */
import { api } from '../api/endpoints'
import type { PlaidSuccessMetadata } from '../plaid'

const LINK_SCRIPT_SRC = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'

let scriptPromise: Promise<void> | null = null

function loadPlaidScript(): Promise<void> {
  if (window.Plaid) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-plaid-link]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('plaid_script_load_failed')))
      return
    }

    const script = document.createElement('script')
    script.src = LINK_SCRIPT_SRC
    script.async = true
    script.dataset.plaidLink = 'true'
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('plaid_script_load_failed'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export type PlaidLinkCallbacks = {
  onSuccess: (publicToken: string, metadata: PlaidSuccessMetadata) => void
  onExit?: (error: { error_message?: string; error_code?: string } | null) => void
}

/**
 * Generate a link token from the backend and open Plaid Link for the
 * current user. Resolves once the widget is open.
 */
export async function openPlaidLink(callbacks: PlaidLinkCallbacks): Promise<void> {
  await loadPlaidScript()

  if (!window.Plaid) {
    throw new Error('plaid_unavailable')
  }

  const { link_token } = await api.plaid.createLinkToken()

  window.Plaid.create({
    token: link_token,
    onSuccess: (publicToken, metadata) => callbacks.onSuccess(publicToken, metadata),
    onExit: (error) => callbacks.onExit?.(error),
  }).open()
}
