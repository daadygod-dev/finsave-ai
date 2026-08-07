import { useEffect, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

type ModalProps = {
  open: boolean
  onClose: () => void
  label: string
  wide?: boolean
  fullPage?: boolean
  children: ReactNode
}

/** Shared modal dialog — centered shell with backdrop, Escape, and scroll lock. */
export function Modal({ open, onClose, label, wide = false, fullPage = false, children }: ModalProps) {
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
      className={cx(
        'fixed inset-0 z-40 flex bg-ink/40 transition-opacity duration-300', 
        fullPage 
          ? 'items-stretch justify-stretch p-0' 
          : 'items-end justify-center p-0 sm:items-center sm:p-4'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className={cx(
          'card-shell w-full transform transition-all duration-300 overflow-auto', 
          fullPage 
            ? 'h-[100dvh] max-w-none overflow-y-auto rounded-none' 
            : 'max-w-none rounded-t-[24px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.04)] animate-slide-up sm:rounded-[24px] sm:shadow-xl sm:animate-fade-up',
          !fullPage && (wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Visual Anchor: Drag Handle Indicator bar for bottom drawer view */}
        {!fullPage && (
          <div className="flex justify-center py-3 sm:hidden">
            <div className="h-1.5 w-12 rounded-full bg-neutral-200" />
          </div>
        )}

        <div 
          className={cx(
            'card-inner overflow-y-auto', 
            fullPage 
              ? 'min-h-full rounded-none p-5 sm:p-8 lg:p-10' 
              : 'p-6 max-h-[85vh] pb-10 sm:max-h-none sm:pb-6'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
