import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { OnboardingDrawer } from '../onboarding/OnboardingDrawer'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/endpoints'
import { PageLoader } from '../ui/PageLoader'
import { ErrorState } from '../ui/ErrorState'
import { Card } from '../ui/Card'

/** Sidebar footprint: expanded 264px, collapsed 76px — flush left, no margin. */
const SIDEBAR_EXPANDED_OFFSET = 'lg:pl-[264px]'
const SIDEBAR_COLLAPSED_OFFSET = 'lg:pl-[76px]'

/**
 * Authenticated application shell. Renders the sidebar flush to the left
 * edge on desktop and a slide-over drawer on mobile, with the routed page
 * in the outlet.
 */
export function AppShell() {
  const { user, completeOnboarding } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [provisioning, setProvisioning] = useState(true)
  const [provisionError, setProvisionError] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // The route is identity-gated and idempotent. This repairs any account
  // confirmed before the email callback had a chance to create its Prisma row.
  useEffect(() => {
    let active = true
    if (!user) return
    setProvisioning(true)
    setProvisionError(false)
    api.auth.register()
      .catch(() => { if (active) setProvisionError(true) })
      .finally(() => { if (active) setProvisioning(false) })
    return () => { active = false }
  }, [user?.id])

  if (provisioning) return <PageLoader label="Preparing your FinSave workspace" />

  if (provisionError) {
    return <main className="min-h-screen bg-ledger p-6"><div className="mx-auto max-w-lg pt-24"><Card><ErrorState title="Workspace setup unavailable" message="We could not prepare your FinSave profile. Check your connection and try again." onRetry={() => window.location.reload()} /></Card></div></main>
  }

  return (
    <div className="min-h-screen bg-ledger text-ink">
      {/* Desktop sidebar — flush to the left edge, no margin, square corners */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
          />
          <Sidebar className="animate-slide-in-left absolute inset-y-0 left-0" />
        </div>
      )}

      <div
        className={cx(
          'transition-[padding] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
          sidebarCollapsed ? SIDEBAR_COLLAPSED_OFFSET : SIDEBAR_EXPANDED_OFFSET,
        )}
      >
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
      {user && !user.onboardingComplete && <OnboardingDrawer onComplete={completeOnboarding} />}
    </div>
  )
}
