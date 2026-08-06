import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Replaces the action label with consistent, accessible progress feedback. */
  loading?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-[0_8px_20px_rgba(112,201,94,0.2)] hover:bg-brand-deep',
  secondary: 'border border-[#e1e5ee] bg-white text-ink/80 hover:border-brand/30 hover:text-ink',
  ghost: 'text-ink/60 hover:bg-ink/5 hover:text-ink',
  danger: 'bg-brick text-white hover:bg-brick/90',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export function Button({ variant = 'primary', size = 'md', className, loading = false, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <><Spinner size={size === 'sm' ? 14 : 16} label="Loading" /> Loading</> : children}
    </button>
  )
}
