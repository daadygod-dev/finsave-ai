import type { ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'

/** Global provider composition — add new providers here, in order. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  )
}
