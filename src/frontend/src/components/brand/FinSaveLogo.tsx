import { cx } from '../../lib/cx'

type FinSaveLogoProps = {
  className?: string
  label?: boolean
  dark?: boolean
}

/** Canonical FinSave shield, used across authentication and the app shell. */
export function FinSaveLogo({ className, label = false, dark = false }: FinSaveLogoProps) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <img src="/finsave-shield.png" alt="FinSave AI" className="h-10 w-10 rounded-xl object-cover" />
      {label && <span className={cx('text-lg font-semibold tracking-[-0.03em]', dark ? 'text-white' : 'text-ink')}>FinSave AI</span>}
    </span>
  )
}
