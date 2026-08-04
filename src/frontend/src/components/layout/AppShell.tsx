import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** Sidebar footprint: expanded 264px, collapsed 76px — flush left, no margin. */
const SIDEBAR_EXPANDED_OFFSET = 'lg:pl-[264px]'
const SIDEBAR_COLLAPSED_OFFSET = 'lg:pl-[76px]'

/**
 * Authenticated application shell. Renders the sidebar flush to the left
 * edge on desktop and a slide-over drawer on mobile, with the routed page
 * in the outlet.
 */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-white text-ink">
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
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
