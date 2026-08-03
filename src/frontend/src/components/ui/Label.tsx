import type { LabelHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cx('mb-1.5 block text-sm font-medium text-ink/70', className)}
      {...props}
    />
  )
}
