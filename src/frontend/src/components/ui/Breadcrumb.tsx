import { ChevronRight, Home } from 'lucide-react'

type BreadcrumbProps = { current: string; section?: string }

/** Compact shadcn-style breadcrumb used by the shared page heading. */
export function Breadcrumb({ current, section }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-ink/45">
      <Home size={13} aria-hidden="true" />
      {section && <><ChevronRight size={13} aria-hidden="true" /><span>{section}</span></>}
      <ChevronRight size={13} aria-hidden="true" />
      <span className="text-ink/70" aria-current="page">{current}</span>
    </nav>
  )
}
