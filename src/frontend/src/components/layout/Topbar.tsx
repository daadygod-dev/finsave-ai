import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cx } from '../../lib/cx'
import { displayName } from '../../lib/userProfile'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '../../components/ui/drawer'


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
  const [themeHint, setThemeHint] = useState(false)

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
  }, []);
  


   const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])


  return (
    <header className="sticky top-0 z-30 border-b border-[#e7eaf2] bg-white/95 backdrop-blur-sm">
      <div className="flex h-[106px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <button
          onClick={onMenu}
          className="rounded-full p-2 text-ink/60 outline-none transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="hidden min-w-[200px] lg:block">
          <p className="text-[26px] font-semibold leading-none tracking-[-0.04em] text-ink">Dashboard</p>
          <p className="mt-1.5 text-sm text-ink/60">Welcome back, {displayName(user)}!</p>
        </div>

        {/* Centered search */}
        <div className="relative mx-auto w-full max-w-[418px] flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search anything..."
            aria-label="Search"
            className="w-full rounded-xl border border-[#e2e6ef] bg-white py-3 pl-10 pr-14 text-sm text-ink shadow-[0_4px_16px_rgba(21,26,45,0.02)] outline-none transition-colors duration-200 placeholder:text-ink/40 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-ledger px-1.5 py-0.5 text-[10px] font-medium text-ink/45">
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
              className="relative rounded-full border border-[#e8ebf2] p-2.5 text-ink/60 outline-none transition-colors duration-200 hover:bg-ledger hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={18} aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-1 flex h-2 min-w-2 items-center justify-center rounded-full border-none border-white bg-red-600 px-1 text-[9px] font-bold text-white"
              ></span>
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

          {/* <button
            type="button"
            onClick={() => setThemeHint((value) => !value)}
            aria-label="Theme toggle shortcut"
            title="Theme toggle shortcut"
            className={cx(
              'hidden rounded-full border border-[#e8ebf2] p-2.5 text-ink/60 outline-none transition-colors duration-200 hover:bg-ledger hover:text-ink focus-visible:ring-2 focus-visible:ring-brand sm:inline-flex',
              themeHint && 'bg-ledger text-brand',
            )}
          >
            {themeHint ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button> */}

                    {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(false)
                setProfileOpen((value) => !value)
              }}
              className={cx(
                'flex items-center rounded-full py-1 pl-1 pr-2.5 outline-2 outline-ink transition-colors duration-200 hover:bg-ledger hover:border-ink focus-visible:ring-2 focus-visible:ring-brand sm:gap-2 sm:pl-1.5 sm:pr-3',
                profileOpen && 'bg-ink/5',
              )}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Account menu"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white shadow-[0_4px_14px_rgba(112,201,94,0.2)]">
                {initials(displayName(user))}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block truncate text-xs font-semibold text-ink">
                  {displayName(user)}
                </span>
                <span className="block text-[11px] text-ink/50">MSME Owner <span className="sr-only">Signed in</span></span>
              </span>
              <ChevronDown
                size={17}
                aria-hidden="true"
                className={cx(
                  'hidden text-ink/90 transition-transform duration-200 md:block',
                  profileOpen && 'rotate-180',
                )}
              />
            </button>
            
            {/* Desktop Overlay Menu Layout */}
            {profileOpen && !isMobile && (
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
                    className="flex items-center gap-2 w-fit rounded-full px-3 py-2 text-sm text-ink/80 outline-none transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
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

            {/* Responsive Mobile Sheet Drawer Layout */}
            <Drawer open={profileOpen && isMobile} onOpenChange={setProfileOpen}>
              <DrawerContent className="p-6 pb-8 bg-white border-t border-neutral-100 rounded-t-[28px]">
                <DrawerHeader className="text-left p-0 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {initials(displayName(user))}
                    </span>
                    <div className="min-w-0">
                      <DrawerTitle className="text-base font-bold text-neutral-900 tracking-tight">
                        {displayName(user)}
                      </DrawerTitle>
                      <DrawerDescription className="text-xs text-neutral-400 truncate mt-0.5">
                        {user?.email}
                      </DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <div className="flex flex-col gap-2">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200/70 p-4 text-sm font-semibold text-neutral-800 transition-colors active:bg-neutral-50"
                  >
                    <Settings size={18} className="text-neutral-400" />
                    Settings Workspace
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      void signOut()
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50/30 p-4 text-sm font-semibold text-red-600 transition-colors active:bg-red-50"
                  >
                    <LogOut size={18} className="text-red-400" />
                    Sign out of FinSave
                  </button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

        </div>
      </div>
    </header>
  )
}
