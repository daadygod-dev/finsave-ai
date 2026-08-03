import { NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sprout,
  Target,
  Umbrella,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cx } from '../../lib/cx'

const NAV_ITEMS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/goals', label: 'Savings goals', icon: Target },
  { to: '/credit-score', label: 'Credit score', icon: ShieldCheck },
  { to: '/insurance', label: 'Insurance', icon: Umbrella },
  { to: '/settings', label: 'Settings', icon: Settings },
]

type SidebarProps = {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { user, signOut } = useAuth()

  return (
    <div
      className={cx(
        'flex flex-col border-r border-ink/10 bg-white',
        className,
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 pb-6 pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-palm text-white">
          <Sprout size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">FinSave AI</p>
          <p className="text-[11px] text-ink/45">MSME money coach</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-lake',
                isActive
                  ? 'bg-palm/10 font-semibold text-ink'
                  : 'text-ink/55 hover:bg-ink/5 hover:text-ink',
              )
            }
          >
            <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Session footer */}
      <div className="flex items-center justify-between gap-2 border-t border-ink/10 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink/80">{user?.email}</p>
          <p className="text-[11px] text-ink/45">Signed in</p>
        </div>
        <button
          onClick={() => void signOut()}
          className="shrink-0 rounded-full p-2 text-ink/45 outline-none transition-colors duration-200 hover:bg-brick/10 hover:text-brick focus-visible:ring-2 focus-visible:ring-lake"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
