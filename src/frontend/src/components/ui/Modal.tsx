import { useEffect, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

type ModalProps = {
  open: boolean
  onClose: () => void
  label: string
  wide?: boolean
  children: ReactNode
}

/** Shared modal dialog — centered shell with backdrop, Escape, and scroll lock. */
export function Modal({ open, onClose, label, wide = false, children }: ModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className={cx('card-shell w-full animate-fade-up', wide ? 'max-w-2xl' : 'max-w-lg')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="card-inner p-6">{children}</div>
      </div>
    </div>
  )
}
