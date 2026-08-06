import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cx } from '../lib/cx'

type ToastKind = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

type ToastApi = {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const KIND_STYLES: Record<ToastKind, { icon: typeof Info; iconClass: string; barClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-palm', barClass: 'bg-palm' },
  error: { icon: XCircle, iconClass: 'text-brick', barClass: 'bg-brick' },
  info: { icon: Info, iconClass: 'text-brand', barClass: 'bg-brand' },
}

const AUTO_DISMISS_MS = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++idRef.current
      setToasts((list) => [...list.slice(-3), { id, kind, title, description }])
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const toast = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toastItem) => {
          const style = KIND_STYLES[toastItem.kind]
          const Icon = style.icon

          return (
            <div
              key={toastItem.id}
              className="toast-enter pointer-events-auto relative overflow-hidden rounded-2xl border border-ink/10 bg-white pl-4 pr-3 shadow-lg shadow-ink/5"
              role="status"
            >
              <span aria-hidden="true" className={cx('absolute inset-y-0 left-0 w-1', style.barClass)} />
              <div className="flex items-start gap-2.5 py-3">
                <Icon size={17} aria-hidden="true" className={cx('mt-0.5 shrink-0', style.iconClass)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{toastItem.title}</p>
                  {toastItem.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
                      {toastItem.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toastItem.id)}
                  className="rounded-full p-1 text-ink/40 outline-none transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-lake"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
