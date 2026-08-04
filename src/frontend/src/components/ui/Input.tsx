import type { InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      className={cx(
        'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink shadow-[inset_0_1px_1px_rgba(15,18,21,0.02)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink/40 focus:ring-2',
        invalid
          ? 'border-brick/50 focus:border-brick focus:ring-brick/20'
          : 'border-ink/15 focus:border-brand/50 focus:ring-brand/25',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}
