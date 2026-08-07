import { useCallback, useMemo, useState } from 'react'
import { Calculator, CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { CreditScoreHistoryEntry, CreditScoreResult } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Spinner } from '../components/ui/Spinner'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/format'
import {
  CREDIT_MAX_SCORE,
  CREDIT_MIN_SCORE,
  FACTOR_KEYS,
  FACTOR_META,
  scoreBand,
  scoreToPercent,
} from '../lib/creditFactors'

export function CreditScorePage() {
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(() => api.creditScore.get(), [])
  // History only matters once a score exists; the endpoint is msme_owner
  // gated, so don't fire it (and a 403) for individual accounts.
  const history = useAsync(() => api.creditScore.history(), [data !== null])
  const summary = useAsync(() => api.summarize(), [])
  const noScoreYet = error?.code === 'credit_score_not_found'
  const roleGated = error?.code === 'forbidden' || error?.status === 403

  const handleComputed = useCallback(
    (result: CreditScoreResult) => {
      toast.success('Score computed', `Your MSME credit score is ${result.score}/${CREDIT_MAX_SCORE}.`)
      void reload()
      void history.reload()
    },
    [reload, history, toast],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Credit score"
        title="MSME credit standing"
        description="An explainable score computed from your real cash flow and transaction behavior."
      />

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]">
          <Spinner size={26} label="Loading credit score" className="text-palm" />
        </div>
      ) : roleGated ? (
        <div className="card-shell animate-fade-up">
          <div className="card-inner p-6">
            <p className="text-sm font-semibold text-ink">Available for MSME owner accounts</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink/60">
              Credit scoring is an MSME feature — it reads your business cash flow across every
              linked account. If you manage a business, switch your account type to MSME owner to
              compute a score here.
            </p>
          </div>
        </div>
      ) : error && !noScoreYet ? (
        <ErrorState
          title="Score unavailable"
          message={`The backend returned an error (${error.code}).`}
          onRetry={() => reload()}
        />
      ) : data ? (
        <>
          <ScoreResultCard
            credit={data}
            history={history.data?.history ?? []}
            spendingRatio={spendingRatio(summary.data)}
            onRecompute={handleComputed}
          />
          <HistoryCard history={history.data?.history ?? []} />
        </>
      ) : (
        <ComputeCard onComputed={handleComputed} />
      )}
    </div>
  )
}

/** Spending share of income from the live summary — feeds the risk guidance. */
function spendingRatio(summary: { byAccount: Array<{ incomeMinor: string; spendingMinor: string }> } | null): number | null {
  if (!summary) return null

  let income = 0n
  let spending = 0n
  for (const account of summary.byAccount) {
    income += BigInt(account.incomeMinor)
    spending += BigInt(account.spendingMinor)
  }

  if (income <= 0n) return null
  // Cap at 100% — spending can outrun income, but the displayed ratio never
  // exceeds the ceiling (and the derived focus value stays non-negative).
  return Math.min(100, Math.round((Number(spending) * 100) / Number(income)))
}

function ScoreResultCard({
  credit,
  history,
  spendingRatio: ratio,
  onRecompute,
}: {
  credit: CreditScoreResult
  history: CreditScoreHistoryEntry[]
  spendingRatio: number | null
  onRecompute: (result: CreditScoreResult) => void
}) {
  const band = scoreBand(credit.score)
  const scorePercent = scoreToPercent(credit.score)

  const strengths = useMemo(
    () =>
      FACTOR_KEYS.map((key) => ({
        meta: FACTOR_META[key],
        value: FACTOR_META[key].display(credit.factors),
      }))
        .filter((factor) => factor.value >= 65)
        .map((factor) => ({
          label: factor.meta.label,
          value: factor.value,
          body: factor.meta.positive,
        })),
    [credit],
  )

  const focus = useMemo(() => {
    const areas = FACTOR_KEYS.map((key) => ({
      meta: FACTOR_META[key],
      value: FACTOR_META[key].display(credit.factors),
    }))
      .filter((factor) => factor.value < 50)
      .map((factor) => ({
        label: factor.meta.label,
        value: factor.value,
        body: factor.meta.improve,
      }))

    if (ratio !== null && ratio >= 80) {
      areas.unshift({
        label: 'High spending',
        value: 100 - ratio,
        body: `Spending is ${ratio}% of income — keeping it under 80% protects cash flow and credit standing.`,
      })
    }

    return areas
  }, [credit, ratio])

  const previousScore =
    history.length > 1 ? history[1].score : null
  const delta = previousScore === null ? null : credit.score - previousScore

  return (
    <div className="card-shell animate-fade-up">
      <div className="card-inner flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-ink/60">
              <ShieldCheck size={18} aria-hidden="true" className="text-palm" />
              MSME credit score
            </p>              <p className="mt-2 text-7xl font-semibold leading-none tracking-tight tabular">
                {credit.score}
                <span className="text-2xl text-ink/40">/{CREDIT_MAX_SCORE}</span>
              </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`text-sm font-semibold ${band.tone}`}>{band.label}</span>
              {delta !== null && delta !== 0 && (
                <Badge tone={delta > 0 ? 'palm' : 'brick'}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} since last compute
                </Badge>
              )}
              <Badge>Computed {formatDate(credit.computedAt)}</Badge>
            </div>
          </div>

          <div className="w-full sm:max-w-[18rem]">
            <div
              role="img"
              aria-label={`Credit score ${credit.score} out of ${CREDIT_MAX_SCORE}`}
            >
              {/* The [300, 850] integer score is mapped onto a strict 0–100
                  layout percentage (scoreToPercent) — only that clamped
                  percentage reaches the progress track. The raw score stays
                  in the number column. */}
              <ProgressBar value={scorePercent} tone="palm" className="h-2" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-ink/40">
              <span>{CREDIT_MIN_SCORE}</span>
              <span className="tabular text-brand">{scorePercent}% of range</span>
              <span>{CREDIT_MAX_SCORE}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-ink/10 pt-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
              What drives this score
            </p>
            {FACTOR_KEYS.map((key) => {
              const meta = FACTOR_META[key]
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-xs text-ink/55">{meta.label}</span>
                  <ProgressBar value={meta.display(credit.factors)} tone="brand" className="flex-1" />
                  <span className="w-32 shrink-0 text-right text-xs font-semibold text-ink/70 tabular">
                    {meta.raw(credit.factors)}
                  </span>
                </div>
              )
            })}
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => {
                void api.creditScore.compute().then(onRecompute)
              }}
            >
              Recompute score
            </Button>
          </div>

          <div className="flex flex-col gap-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
              About this score
            </p>
            <p className="text-sm leading-relaxed text-ink/60">
              Your score reads across every linked account — bank and mobile money — and is
              recomputed as new transactions arrive. Each computation is stored, so your history
              below charts the trend.
            </p>
          </div>
        </div>

        {/* Factor guidance */}
        <div className="grid gap-5 border-t border-ink/10 pt-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-palm">
              <CheckCircle2 size={14} aria-hidden="true" />
              What's working
            </p>
            {strengths.length === 0 ? (
              <p className="text-sm text-ink/50">No strong factors yet — every area is building.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {strengths.map((item) => (
                  <li key={item.label} className="rounded-xl border border-palm/25 bg-palm/5 px-3.5 py-2.5">
                    <p className="text-sm font-semibold text-ink">
                      {item.label} <span className="text-xs font-medium text-palm tabular">· {item.value}/100</span>
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{item.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brick">
              <TrendingUp size={14} aria-hidden="true" />
              Focus areas
            </p>
            {focus.length === 0 ? (
              <p className="text-sm text-ink/50">
                Nothing urgent — keep the current behavior steady to hold this score.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {focus.map((item) => (
                  <li key={item.label} className="rounded-xl border border-brick/25 bg-brick/5 px-3.5 py-2.5">
                    <p className="text-sm font-semibold text-ink">
                      {item.label} <span className="text-xs font-medium text-brick tabular">· {item.value}/100</span>
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{item.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryCard({ history }: { history: CreditScoreHistoryEntry[] }) {
  const points = useMemo(
    () =>
      [...history]
        .reverse()
        .map((entry) => ({
          label: new Date(entry.computedAt).toLocaleDateString('en-GB', { month: 'short' }),
          score: entry.score,
        })),
    [history],
  )

  return (
    <div className="card-shell animate-fade-up">
      <div className="card-inner p-6">
        <h2 className="text-lg font-semibold">Score history</h2>
        <p className="mt-1 text-sm text-ink/55">
          {points.length === 0
            ? 'No history yet — each compute is recorded here.'
            : `${points.length} computation${points.length === 1 ? '' : 's'} so far.`}
        </p>

        {points.length < 2 ? (
          <div className="mt-6 rounded-xl border border-dashed border-ink/20 bg-ledger px-4 py-10 text-center">
            <p className="text-sm text-ink/50">
              {points.length === 1
                ? 'Recompute the score once more to start charting the trend.'
                : 'Compute your score to begin a trend line.'}
            </p>
          </div>
        ) : (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(23,33,27,0.08)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'rgba(23,33,27,0.55)' }}
                />
                <YAxis
                  domain={[CREDIT_MIN_SCORE, CREDIT_MAX_SCORE]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'rgba(23,33,27,0.55)' }}
                />
                <Tooltip
                  formatter={(value) => [`${value}/${CREDIT_MAX_SCORE}`, 'Score']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(23,33,27,0.1)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1f6f4a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1f6f4a', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function ComputeCard({ onComputed }: { onComputed: (result: CreditScoreResult) => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compute = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const result = await api.creditScore.compute()
      onComputed(result)
    } catch (error) {
      // Distinguish the failure modes so the message is actionable instead of
      // a generic catch-all.
      if (error instanceof ApiError && (error.code === 'forbidden' || error.status === 403)) {
        setError(
          'Credit scoring is available for MSME owner accounts only — switch your account type to compute a score.',
        )
      } else if (error instanceof ApiError && error.code === 'no_linked_accounts') {
        setError('Link at least one account first — the score is derived from your transaction history.')
      } else if (error instanceof ApiError) {
        setError(`The backend rejected the request (${error.code}). Try again in a moment.`)
      } else {
        setError('The backend is unreachable. Check that it is running (`npm run dev:api`) and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card-shell animate-fade-up">
      <div className="card-inner p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-2">
          <Calculator size={20} aria-hidden="true" className="text-brand" />
          <h2 className="text-lg font-semibold">Compute your score</h2>
        </div>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-ink/60">
          No score exists yet. Your score is derived from your linked transaction history across
          every account — bank and mobile money. Recompute whenever new transactions arrive.
        </p>

        {error && (
          <p className="mb-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {error}
          </p>
        )}

        <Button onClick={compute} loading={submitting}>
          {submitting ? 'Computing…' : 'Compute score'}
        </Button>
      </div>
    </div>
  )
}
