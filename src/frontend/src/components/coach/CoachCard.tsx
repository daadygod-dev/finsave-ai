import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, PiggyBank, Target, ShieldCheck } from 'lucide-react'
import { api } from '../../api/endpoints'
import type { CoachInsight } from '../../api/types'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { cx } from '../../lib/cx'

const TYPE_ICONS: Record<CoachInsight['type'], typeof Sparkles> = {
  summary: TrendingUp,
  warning: AlertTriangle,
  savings: PiggyBank,
  goal: Target,
  credit: ShieldCheck,
}

const TONE_STYLES: Record<CoachInsight['tone'], { ring: string; icon: string }> = {
  info: { ring: 'border-lake/25 bg-lake/5', icon: 'text-lake' },
  success: { ring: 'border-palm/25 bg-palm/5', icon: 'text-palm' },
  warning: { ring: 'border-maize/40 bg-maize/10', icon: 'text-ink/70' },
}

type CoachCardProps = {
  /** Render fewer insights, tighter spacing — for embedding in narrow rails. */
  compact?: boolean
  title?: string
  className?: string
}

/**
 * Reusable AI financial coach. Fetches the authenticated user's insights
 * from the backend (/api/v1/coach/insights), which are built from their
 * real transactions, goals, credit score, and cash-flow surplus — the LLM
 * only polishes wording, never the numbers.
 */
export function CoachCard({ compact = false, title = 'AI coach', className }: CoachCardProps) {
  const { data, error, loading, reload } = useAsync(() => api.coach.insights(), [])

  const insights = data?.insights ?? []
  const shown = compact ? insights.slice(0, 3) : insights

  return (
    <section className={cx('card-shell animate-fade-up', className)}>
      <div className="card-inner p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={20} aria-hidden="true" className="text-palm" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={reload}
            className="rounded-full p-2 text-ink/45 outline-none transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-lake"
            aria-label="Refresh insights"
          >
            <RefreshCw size={15} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading insights">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <ErrorState
            title="Coach unavailable"
            message="Insights are computed from your real cash flow — connect an account to get started."
            onRetry={reload}
          />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={22} strokeWidth={1.75} />}
            title="Nothing to coach yet"
            body="Once you link an account, your coach will summarize spending, flag risks, and suggest savings targets."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((insight) => {
              const Icon = TYPE_ICONS[insight.type]
              const tone = TONE_STYLES[insight.tone]

              return (
                <li
                  key={insight.id}
                  className={cx('flex gap-3 rounded-xl border p-3.5', tone.ring)}
                >
                  <span className={cx('mt-0.5 shrink-0', tone.icon)}>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{insight.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink/65">{insight.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {compact && insights.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => undefined}
            title="Open the full dashboard to see all insights"
          >
            {insights.length - 3} more insight{insights.length - 3 === 1 ? '' : 's'} in your feed
          </Button>
        )}
      </div>
    </section>
  )
}
