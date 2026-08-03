import type { HTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

type BadgeTone = 'neutral' | 'palm' | 'lake' | 'maize' | 'brick'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-ink/10 bg-ink/5 text-ink/60',
  palm: 'border-palm/25 bg-palm/10 text-palm',
  lake: 'border-lake/25 bg-lake/10 text-lake',
  maize: 'border-maize/40 bg-maize/15 text-ink/80',
  brick: 'border-brick/25 bg-brick/10 text-brick',
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
