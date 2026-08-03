import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
}

/** Shared error state with an optional retry action. */
export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-brick/25 bg-brick/5 px-4 py-8 text-center">
      <AlertTriangle size={22} strokeWidth={1.75} aria-hidden="true" className="text-brick" />
      <p className="text-sm font-semibold text-ink/80">{title}</p>
      {message && <p className="max-w-sm text-xs leading-relaxed text-ink/55">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  )
}
