import type { HTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

/** Skeleton placeholder block for loading states. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-pulse rounded-xl bg-ink/10', className)}
      {...props}
    />
  )
}

/** A full card-shaped skeleton — convenient for content blocks. */
export function SkeletonCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]', className)}
      {...props}
    />
  )
}
