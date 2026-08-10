import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface LegalSection {
  id: string
  label: string
}

/**
 * Shared frame for public legal documents (privacy policy, terms of service):
 * back link, document header, intro, table of contents, article body and footer.
 * Both pages render identically so the legal suite feels like one family.
 */
export function LegalPageLayout({
  title,
  lastUpdated,
  icon: Icon,
  intro,
  sections,
  children,
}: {
  title: string
  lastUpdated: string
  icon: LucideIcon
  intro: ReactNode
  sections: LegalSection[]
  children: ReactNode
}) {
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <main className="min-h-screen bg-ledger px-4 py-10 text-ink sm:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand outline-none rounded transition-colors duration-200 hover:text-brand-deep focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ledger"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to FinSave
        </Link>

        <header className="mt-6 flex items-start gap-4">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10">
            <Icon size={22} aria-hidden="true" className="text-brand" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">finsave ai</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-1 text-sm text-ink/55">{lastUpdated}</p>
          </div>
        </header>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/70">{intro}</div>

        {/* Table of contents */}
        <nav aria-label="Table of contents" className="card-inner mt-8 p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-tight">On this page</h2>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(event) => scrollToSection(event, section.id)}
                  className="group inline-flex items-baseline gap-2 text-sm text-ink/70 outline-none rounded transition-colors duration-200 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <span className="tabular text-xs font-medium text-ink/35">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="group-hover:underline">{section.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-10 space-y-12">{children}</article>

        <footer className="mt-12 border-t border-neutral-200 pt-6 pb-4">
          <p className="text-xs leading-relaxed text-ink/45">
            © {new Date().getFullYear()} finsave ai ·{' '}
            <Link
              to="/"
              className="font-medium text-brand outline-none rounded transition-colors duration-200 hover:text-brand-deep focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              finsave.aitoolshq.space
            </Link>
          </p>
        </footer>
      </div>
    </main>
  )
}

/** Renders a definition term + body pair inside a definitions list. */
export function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-1">
      <span className="font-semibold text-ink">{name}</span>
      <p className="text-sm leading-relaxed text-ink/70">{children}</p>
    </li>
  )
}
