import { Link, NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChevronsLeft,
  ChevronsRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Target,
  Umbrella,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cx } from '../../lib/cx'
import { displayName } from '../../lib/userProfile'
import { FinSaveLogo } from '../brand/FinSaveLogo'

const NAV_GROUPS: Array<{
  label: string
  items: Array<{ to: string; label: string; icon: LucideIcon; badge?: string }>
}> = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/accounts', label: 'Accounts', icon: Landmark },
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/goals', label: 'Goals', icon: Target },
    ],
  },
  {
    label: 'Credit & Insurance',
    items: [
      { to: '/credit-score', label: 'Credit Score', icon: ShieldCheck },
      { to: '/insurance', label: 'Insurance', icon: Umbrella },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

/** Two-letter avatar initials from the display name; falls back to the brand mark. */
function initialsOf(name: string): string {
  const chars = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
  return (chars || 'FS').toUpperCase()
}

type SidebarProps = {
  className?: string
  /**
   * Desktop collapse state. Omit to render the always-expanded mobile
   * drawer (labels and profile stay visible, no toggle shown).
   */
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ className, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, signOut } = useAuth()
  const name = displayName(user)

  const label = (text: string, className?: string) => (
    <span
      className={cx(
        'overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
        collapsed ? 'w-0 opacity-0' : 'w-auto pl-3 opacity-100',
        className,
      )}
    >
      {text}
    </span>
  )

  return (
    <div
      className={cx(
        'flex h-full flex-col overflow-hidden border-r border-white/[0.07] bg-[#101827]',
        'transition-[width] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
        collapsed ? 'w-[76px]' : 'w-[264px]',
        className,
      )}
    >
      {/* Brand */}
      <div
        className={cx(
          'flex shrink-0 items-center py-7',
          collapsed ? 'justify-center' : 'gap-2.5 px-5',
        )}
      >
        <FinSaveLogo className="shrink-0" />
        <div
          className={cx(
            'min-w-0 overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
          )}
        >
          <p className="truncate text-lg font-semibold tracking-[-0.03em] text-white">FinSave AI</p>
          <p className="text-[11px] text-slate-400">MSME money coach</p>
        </div>
      </div>

      {/* Divider between branding and navigation */}
      <div className="mx-5 shrink-0 border-t border-white/[0.08]" />

      {/* Navigation — the only scrollable region */}
      <nav
        className="sidebar-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4"
        aria-label="Main navigation"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col">
            <p
              className={cx(
                'px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 first:pt-0',
                collapsed && 'hidden',
              )}
            >
              {group.label}
            </p>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cx(
                        'group relative flex items-center rounded-xl py-2.5 text-sm font-medium outline-none transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#101827]',
                        collapsed ? 'justify-center' : 'pl-4 pr-3',
                        isActive
                          ? 'bg-brand font-semibold text-white shadow-[0_8px_22px_rgba(112,201,94,0.28)]'
                          : 'text-slate-300 hover:bg-white/[0.08] hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={20}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className={cx(
                            'shrink-0 transition-colors duration-200',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                          )}
                        />
                        {label(item.label)}
                        {item.badge && (
                          <span
                            className={cx(
                              'ml-auto rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white shadow-[0_2px_6px_-1px_rgba(112,201,94,0.6)]',
                              collapsed && 'hidden',
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Session footer — stays fixed while navigation scrolls */}
      <div className="shrink-0 border-t border-white/[0.08] p-3">
        {/* Bottom user card — separate solid darker surface, fully opaque */}
        <div
          className={cx(
            'rounded-xl border border-white/[0.08] bg-black/10',
            collapsed ? 'p-1.5' : 'p-2',
          )}
        >
        <div className={cx('flex items-center gap-1.5', collapsed && 'flex-col gap-2')}>
          <Link
            to="/settings"
            title={collapsed ? 'Settings' : undefined}
            aria-label={collapsed ? 'Settings' : undefined}
            className={cx(
              'flex min-w-0 flex-1 items-center rounded-2xl p-2 outline-none transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-brand',
              collapsed && 'flex-col',
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
              {initialsOf(name)}
            </span>
            <span
              className={cx(
                'min-w-0 overflow-hidden text-left transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
                collapsed ? 'w-0 opacity-0' : 'w-auto pl-2.5 opacity-100',
              )}
            >
              <span className="block truncate text-xs font-semibold text-white">{name}</span>
              <span className="block truncate text-[11px] text-slate-400">{user?.email}</span>
            </span>
          </Link>

          <button
            onClick={() => void signOut()}
            className="shrink-0 rounded-full p-2 text-slate-300 outline-none transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] hover:text-brick focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cx(
              'mt-2 flex w-full items-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 text-xs font-medium text-slate-300 outline-none transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-brand',
              collapsed ? 'justify-center' : 'px-3',
            )}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight size={16} aria-hidden="true" />
            ) : (
              <>
                <ChevronsLeft size={16} aria-hidden="true" />
                <span className="ml-2">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
