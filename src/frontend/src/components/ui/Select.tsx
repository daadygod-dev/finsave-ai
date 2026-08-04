import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '../../lib/cx'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <span className="relative block">
      <select
        className={cx(
          'h-11 w-full appearance-none rounded-xl border border-ink/15 bg-white px-3.5 pr-10 text-sm text-ink shadow-[inset_0_1px_1px_rgba(15,18,21,0.02)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand/50 focus:ring-2 focus:ring-brand/25',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/45"
      />
    </span>
  )
}
