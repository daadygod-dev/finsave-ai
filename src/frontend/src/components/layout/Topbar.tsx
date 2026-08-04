import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Search, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cx } from '../../lib/cx'
import { displayName } from '../../lib/userProfile'

type TopbarProps = {
  onMenu: () => void
}

/** Two-letter avatar initials; falls back to the brand mark. */
function initials(name: string): string {
  const chars = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
  return (chars || 'FS').toUpperCase()
}

export function Topbar({ onMenu }: TopbarProps) {
  const { user, signOut } = useAuth()
  const searchRef = useRef<HTMLInputElement>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Close the header popovers on Escape.
  useEffect(() => {
    if (!notificationsOpen && !profileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [notificationsOpen, profileOpen])

  // ⌘K / Ctrl+K focuses the header search — a local affordance, no data logic.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-[#d7e6f3] bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <button
          onClick={onMenu}
          className="rounded-full p-2 text-ink/60 outline-none transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        {/* Centered search */}
        <div className="relative mx-auto w-full max-w-xl flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search"
            aria-label="Search"
            className="w-full rounded-full border border-ink/10 bg-ledger py-2.5 pl-10 pr-14 text-sm text-ink outline-none transition-colors duration-200 placeholder:text-ink/40 focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-ink/10 bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink/45">
            ⌘K
          </kbd>
        </div>

        {/* Right-aligned actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(false)
                setNotificationsOpen((value) => !value)
              }}
              className="relative rounded-full p-2 text-ink/60 outline-none transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={18} aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-brand"
              />
            </button>
            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setNotificationsOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_12px_32px_-16px_rgba(23,33,27,0.25)]"
                >
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/55">
                    You're all caught up. New alerts will appear here.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(false)
                setProfileOpen((value) => !value)
              }}
              className={cx(
                'flex items-center rounded-full py-1 pl-1 pr-1.5 outline-none transition-colors duration-200 hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-brand sm:gap-2 sm:pl-1.5 sm:pr-2',
                profileOpen && 'bg-ink/5',
              )}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Account menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {initials(displayName(user))}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block truncate text-xs font-semibold text-ink">
                  {displayName(user)}
                </span>
                <span className="block text-[11px] text-ink/50">Signed in</span>
              </span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={cx(
                  'hidden text-ink/40 transition-transform duration-200 md:block',
                  profileOpen && 'rotate-180',
                )}
              />
            </button>
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_12px_32px_-16px_rgba(23,33,27,0.25)]"
                >
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-ink">{displayName(user)}</p>
                    <p className="truncate text-[11px] text-ink/50">{user?.email}</p>
                  </div>
                  <div className="my-1 border-t border-ink/10" />
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink/80 outline-none transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <Settings size={15} aria-hidden="true" />
                    Settings
                  </Link>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false)
                      void signOut()
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink/80 outline-none transition-colors duration-150 hover:bg-brick/10 hover:text-brick focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <LogOut size={15} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
