import type { ReactNode } from 'react'
import { Sprout } from 'lucide-react'

/** Shared centered card layout for the authentication pages. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ledger px-4 py-12 text-ink">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-palm text-white">
            <Sprout size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">FinSave AI</h1>
            <p className="mt-1 text-sm text-ink/55">
              Bank and mobile-money money coaching for MSMEs
            </p>
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}
