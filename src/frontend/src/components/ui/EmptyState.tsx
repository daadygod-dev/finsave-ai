import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  title: string
  body?: string
  icon?: ReactNode
  action?: ReactNode
}

/** Shared empty state used across every feature module. */
export function EmptyState({ title, body, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-ink/20 bg-ledger px-4 py-8 text-center">
      <span aria-hidden="true" className="mb-1 text-ink/40">
        {icon ?? <Inbox size={22} strokeWidth={1.75} />}
      </span>
      <p className="text-sm font-semibold text-ink/70">{title}</p>
      {body && <p className="max-w-xs text-xs leading-relaxed text-ink/50">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
