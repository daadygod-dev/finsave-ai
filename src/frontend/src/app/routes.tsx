import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PageLoader } from '../components/ui/PageLoader'
import { useAuth } from '../context/AuthContext'
import { ConfirmEmailPage } from '../pages/ConfirmEmailPage'
import { CreditScorePage } from '../pages/CreditScorePage'
import { AccountsPage } from '../pages/AccountsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { GoalsPage } from '../pages/GoalsPage'
import { InsurancePage } from '../pages/InsurancePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { SettingsPage } from '../pages/SettingsPage'
import { SignUpPage } from '../pages/SignUpPage'
import { TransactionsPage } from '../pages/TransactionsPage'

/**
 * Deny-by-default route gate (AGENTS.md §6): renders the authenticated app
 * shell only when a Supabase session is active; otherwise redirects to /login.
 */
function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageLoader label="Checking session" />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <AppShell />
}

/** Keeps signed-in users out of the sign-in / sign-up / forgot pages. */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') return <PageLoader label="Checking session" />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  return children
}

export const router = createBrowserRouter([
  { path: '/login', element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
  { path: '/signup', element: <PublicOnlyRoute><SignUpPage /></PublicOnlyRoute> },
  { path: '/forgot-password', element: <PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute> },
  // These two consume tokens embedded in the email links — they must stay
  // reachable even after the callback establishes a session mid-page.
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/auth/confirm', element: <ConfirmEmailPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'credit-score', element: <CreditScorePage /> },
      { path: 'insurance', element: <InsurancePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
