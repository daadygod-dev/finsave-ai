import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-ink">
      <p className="text-7xl font-semibold tracking-tight text-ink/15">404</p>
      <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-ink/55">
        That page doesn't exist — or it belongs to a milestone that hasn't been built yet.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>
    </main>
  )
}
