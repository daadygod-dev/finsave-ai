import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '../../lib/cx'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <span className="relative block">
      <select
        className={cx(
          'w-full appearance-none rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 pr-9 text-sm text-ink outline-none transition-colors duration-200 focus:border-lake focus:ring-2 focus:ring-lake/30',
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
