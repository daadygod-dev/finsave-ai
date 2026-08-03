import { Spinner } from './Spinner'

/** Full-page centered loader, used while the session is being verified. */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ledger text-ink"
      role="status"
    >
      <span className="text-palm">
        <Spinner size={28} label={label} />
      </span>
      <p className="text-sm font-medium text-ink/55">{label}…</p>
    </div>
  )
}
