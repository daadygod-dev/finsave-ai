/**
 * Type declarations for the Plaid Link web SDK, which is loaded at runtime
 * from the Plaid CDN (no npm dependency) — see lib/plaidLink.ts.
 */

export type PlaidSuccessMetadata = {
  institution?: { name?: string; institution_id?: string }
  accounts?: Array<{ id: string; name?: string; type?: string; subtype?: string }>
  link_session_id?: string
}

export type PlaidExitMetadata = {
  institution?: { name?: string; institution_id?: string }
  link_session_id?: string
  status?: string
}

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string
        onSuccess: (publicToken: string, metadata: PlaidSuccessMetadata) => void
        onExit?: (error: { error_message?: string; error_code?: string } | null, metadata: PlaidExitMetadata) => void
        onLoad?: () => void
        onEvent?: (eventName: string, metadata: PlaidExitMetadata) => void
      }) => {
        open: () => void
        exit: (options?: { force: boolean }) => void
        destroy: () => void
      }
    }
  }
}
