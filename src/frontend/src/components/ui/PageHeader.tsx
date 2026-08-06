import type { ReactNode } from 'react'
import { Breadcrumb } from './Breadcrumb'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

/** Consistent page-level title block reused by every feature page. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#e7eaf2] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="animate-fade-up">
        <Breadcrumb current={title} section={eyebrow} />
        {eyebrow && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-sm text-ink/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}
