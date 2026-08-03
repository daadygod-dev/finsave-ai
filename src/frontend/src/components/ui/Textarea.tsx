import type { TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cx(
        'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-200 placeholder:text-ink/40 focus:ring-2',
        invalid
          ? 'border-brick/50 focus:border-brick focus:ring-brick/20'
          : 'border-ink/15 focus:border-lake focus:ring-lake/30',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}
