import { cx } from '../../lib/cx'

type ProgressBarProps = {
  value: number
  max?: number
  tone?: 'palm' | 'lake' | 'maize' | 'brick'
  className?: string
}

const TONES = {
  palm: 'bg-palm',
  lake: 'bg-lake',
  maize: 'bg-maize',
  brick: 'bg-brick',
} as const

export function ProgressBar({ value, max = 100, tone = 'lake', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(max, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cx('h-1.5 w-full overflow-hidden rounded-full bg-ink/10', className)}
    >
      <div
        className={cx(
          'h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
          TONES[tone],
        )}
        style={{ width: `${(clamped / max) * 100}%` }}
      />
    </div>
  )
}
