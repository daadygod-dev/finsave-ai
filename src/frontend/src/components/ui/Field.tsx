import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

type FieldProps = {
  label: string
  htmlFor?: string
  error?: string | null
  hint?: string
  children: ReactNode
  className?: string
}

/** Label + control + hint/error wrapper used by every form in the app. */
export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink/70">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink/45">{hint}</p>}
      {error && <p className="text-xs font-medium text-brick">{error}</p>}
    </div>
  )
}
