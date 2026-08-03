import type { LucideIcon } from 'lucide-react'

type PagePlaceholderProps = {
  title: string
  description: string
  milestone: string
  icon: LucideIcon
}

/** Route scaffold for features that land in later milestones. */
export function PagePlaceholder({ title, description, milestone, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/60 px-6 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-palm/10">
        <Icon size={28} strokeWidth={1.75} aria-hidden="true" className="text-palm" />
      </span>
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-ink/55">{description}</p>
      <span className="mt-1 rounded-full border border-ink/10 bg-ledger px-3 py-1 text-xs font-medium text-ink/50">
        Planned for {milestone}
      </span>
    </div>
  )
}
