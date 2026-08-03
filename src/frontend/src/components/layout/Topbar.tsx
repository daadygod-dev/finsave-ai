import { Menu } from 'lucide-react'

type TopbarProps = {
  onMenu: () => void
}

export function Topbar({ onMenu }: TopbarProps) {

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink/10 bg-ledger px-4 sm:px-6 lg:px-8">
      <button
        onClick={onMenu}
        className="rounded-full p-2 text-ink/60 outline-none transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-lake lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-palm">FinSave AI</p>

      <div className="flex-1" />
    </header>
  )
}
