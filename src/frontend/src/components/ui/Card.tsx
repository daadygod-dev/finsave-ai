import type { HTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Outer padding around the inner surface. */
  padded?: boolean
  as?: 'section' | 'div' | 'article'
}

/**
 * Shared white application surface with a restrained diffuse elevation.
 */
export function Card({ padded = true, as: Tag = 'section', className, children, ...props }: CardProps) {
  return (
    <Tag className={cx('card-shell', className)} {...props}>
      <div className={cx('card-inner', padded && 'p-6')}>{children}</div>
    </Tag>
  )
}
