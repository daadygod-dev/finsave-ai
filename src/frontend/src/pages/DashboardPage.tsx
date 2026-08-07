import { useCallback, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Banknote,
  Bell,
  CircleDollarSign,
  CircleGauge,
  Download,
  Landmark,
  Plus,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Smartphone,
  ExternalLink
} from 'lucide-react'
import {
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Account, AccountSource, CreditScoreResult, Summary, Transaction } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CoachCard } from '../components/coach/CoachCard'
import { ConnectModal } from '../components/connect/ConnectModal'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { firstName } from '../lib/userProfile'
import { categoryLabel, categoryMeta } from '../lib/categories'
import { SOURCE_LABELS } from '../lib/sources'
import { compactRwf, formatDate, formatRwf, formatSignedRwf } from '../lib/format'
import {
  CREDIT_MAX_SCORE,
  CREDIT_MIN_SCORE,
  FACTOR_KEYS,
  FACTOR_META,
  scoreBand,
  scoreToPercent,
} from '../lib/creditFactors'

const SOURCE_ICONS: Record<AccountSource, typeof Landmark> = {
  plaid_bank: Landmark,
  bank_csv: Landmark,
  momo_csv: Smartphone,
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

type DashboardData = {
  accounts: Account[]
  transactions: Transaction[]
  summary: Summary
}

async function fetchDashboard(accountId?: string): Promise<DashboardData> {
  const [accountsResult, transactionsResult, summaryResult] = await Promise.all([
    api.accounts(),
    api.transactions({ accountId, limit: 100 }),
    api.summarize(accountId),
  ])

  return {
    accounts: accountsResult.accounts,
    transactions: transactionsResult.transactions,
    summary: summaryResult,
  }
}

function describeError(error: ApiError | null): string {
  if (!error) return 'The dashboard could not be loaded.'
  if (error.code === 'network_error' || error.status === 0) {
    return 'The backend is unreachable. Start it with `npm run dev:api` and ensure the database is configured.'
  }
  return `The backend rejected the request (${error.code}).`
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const toast = useToast()
  const { user } = useAuth()
  const [activeAccountId, setActiveAccountId] = useState<string | undefined>(undefined)
  const [connectOpen, setConnectOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [computingScore, setComputingScore] = useState(false)

  const { data, error, loading, reload } = useAsync(
    () => fetchDashboard(activeAccountId),
    [activeAccountId],
  )

  const credit = useAsync(() => api.creditScore.get(), [])
  const noScoreYet = credit.error?.code === 'credit_score_not_found'
  const roleGated = credit.error?.code === 'forbidden' || credit.error?.status === 403

  const selectAccount = useCallback((accountId?: string) => {
    setActiveAccountId(accountId)
  }, [])

  const computeScore = useCallback(async () => {
    setComputingScore(true)
    try {
      await api.creditScore.compute()
      await credit.reload()
      toast.success('Score computed', 'Your credit score was recalculated from your cash flow.')
    } catch (error) {
      // Surface the real failure instead of a misleading generic message — a
      // role gate, a backend rejection, and an unreachable backend need
      // different guidance.
      if (error instanceof ApiError && (error.code === 'forbidden' || error.status === 403)) {
        toast.error(
          'MSME feature',
          'Credit scoring is available for MSME owner accounts. Switch your account type to compute a score.',
        )
      } else if (error instanceof ApiError) {
        toast.error('Could not compute score', `The backend rejected the request (${error.code}).`)
      } else {
        toast.error(
          'Could not compute score',
          'The backend is unreachable. Start it with `npm run dev:api` and try again.',
        )
      }
    } finally {
      setComputingScore(false)
    }
  }, [credit, toast])

  const balances = useMemo(() => {
    if (!data) return new Map<string, { income: bigint; spending: bigint }>()

    const map = new Map<string, { income: bigint; spending: bigint }>()

    for (const account of data.summary.byAccount) {
      map.set(account.accountId, {
        income: BigInt(account.incomeMinor),
        spending: BigInt(account.spendingMinor),
      })
    }

    return map
  }, [data])

  const alerts = useMemo(() => {
    if (!data) return []

    const result: Array<{ tone: string; title: string; body: string }> = []
    const totalSpending = data.summary.byCategory.reduce(
      (sum, entry) => sum + BigInt(entry.amountMinor),
      0n,
    )

    if (totalSpending > 0n) {
      const top = [...data.summary.byCategory].sort((a, b) =>
        Number(BigInt(b.amountMinor) - BigInt(a.amountMinor)),
      )[0]
      const share = Math.round((Number(BigInt(top.amountMinor)) / Number(totalSpending)) * 100)

      result.push({
        tone: 'text-brick',
        title: 'Top expense',
        body: `${categoryLabel(top.category)} is ${share}% of spending this period.`,
      })
    }

    const income = data.summary.byAccount.reduce(
      (sum, account) => sum + BigInt(account.incomeMinor),
      0n,
    )
    const spending = data.summary.byAccount.reduce(
      (sum, account) => sum + BigInt(account.spendingMinor),
      0n,
    )

    if (income > 0n && spending * 10n > income * 8n) {
      result.push({
        tone: 'text-maize',
        title: 'Spending ratio',
        body: `Spending is ${Math.min(
          100,
          Math.round((Number(spending) / Number(income)) * 100),
        )}% of income this period.`,
      })
    }

    if (data.accounts.length > 1) {
      result.push({
        tone: 'text-palm',
        title: 'Accounts combined',
        body: 'Your summary rolls up all linked accounts — bank and mobile money.',
      })
    }

    return result
  }, [data])

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <header className="flex flex-col gap-4  pb-6 md:flex-row md:items-end md:justify-between">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">
              {greeting()}, {firstName(user)}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink/60">
              Your money at a glance — real balances, spending, credit standing, and savings across
              every linked account.
            </p>
          </div>

         <div className="flex flex-wrap items-stretch gap-3">
  <Button
    variant="secondary"
    onClick={reload}
    className="group flex items-center justify-center gap-2"
  >
    <RotateCw size={16} aria-hidden="true" className="group-hover:rotate-180 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />
    Refresh
  </Button>
  <Button
    onClick={() => setConnectOpen(true)}
    className="group min-w-[164px] flex items-center justify-center gap-2"
  >
    Connect Bank
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffffff] text-[#1e242a] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
      <ArrowUpRight size={15} aria-hidden="true" className='text-brand' />
    </span>
  </Button>
</div>

        </header>

        {/* Body */}
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <Card>
            <ErrorState
              title="Dashboard unavailable"
              message={describeError(error)}
              onRetry={reload}
            />
          </Card>
        ) : data ? (
          <>
            <KpiGrid summary={data.summary} credit={credit.data} loading={credit.loading} />
            <div className="grid gap-6 xl:grid-cols-2">
              <SpendingChartCard summary={data.summary} />
              <CashFlowCard summary={data.summary} />
            </div>
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <ScoreCard
                credit={credit.data}
                loading={credit.loading}
                noScoreYet={noScoreYet}
                roleGated={roleGated}
                accountsCount={data.accounts.length}
                computing={computingScore}
                onCompute={computeScore}
              />
              <TransactionsCard transactions={data.transactions} activeAccountId={activeAccountId} />
            </div>
            <section className="card-shell animate-fade-up"><div className="card-inner flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-base font-semibold text-ink">More account detail is available when you need it.</p><p className="mt-1 text-sm text-ink/55">Review linked accounts, alerts, and coaching guidance in a focused full-screen view.</p></div><Button  className='bg-brand text-white flex gap-1.5' onClick={() => setDetailsOpen(true)}>Open financial details <ExternalLink size={14} /></Button></div></section>
          </>
        ) : null}
      </div>

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={() => {
          setConnectOpen(false)
          void reload()
        }}
      />
{data && (
  <Modal 
    open={detailsOpen} 
    onClose={() => setDetailsOpen(false)} 
    label="Financial details"
    wide
  >
    <div className="flex w-full flex-col max-h-[80vh] sm:max-h-[75vh]">
      {/* Sticky Header Layer */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-100 bg-white pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Financial details</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Accounts, alerts & guidance</h2>
        </div>
        <Button variant="secondary" onClick={() => setDetailsOpen(false)} className="rounded-xl border border-neutral-200 font-semibold px-4 py-2">Close</Button>
      </header>
      
      {/* Scrollable Viewport Container Grid */}
      <div className="flex-1 overflow-y-auto pt-6 pr-1 gap-6 flex flex-col scrollbar-thin">
        <div className="grid gap-6 md:grid-cols-2">
          <AccountsCard 
            accounts={data.accounts} 
            balances={balances} 
            activeAccountId={activeAccountId} 
            onSelectAccount={selectAccount} 
            onConnect={() => { setDetailsOpen(false); setConnectOpen(true) }} 
          />
          <AlertsCard alerts={alerts} />
        </div>
        
        <CoachCard title="Your AI coach" />
      </div>
    </div>
  </Modal>
)}


    </>
  )
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function KpiGrid(props: { summary: Summary; credit: CreditScoreResult | null; loading: boolean }) {
  const income = props.summary.byAccount.reduce((total, item) => total + BigInt(item.incomeMinor), 0n)
  const spending = props.summary.byAccount.reduce((total, item) => total + BigInt(item.spendingMinor), 0n)
  const balance = income - spending
  const savingsRate =
    income > 0n ? Math.min(100, Math.max(0, Math.round((Number(balance) / Number(income)) * 100))) : 0
  const cards = [
    { label: 'Net cash flow', value: formatRwf(balance), icon: CircleDollarSign, tone: 'text-brand', note: 'Across linked accounts' },
    { label: 'Income', value: formatRwf(income), icon: Download, tone: 'text-palm', note: 'This reporting period' },
    { label: 'Expenses', value: formatRwf(spending), icon: Banknote, tone: 'text-brick', note: 'This reporting period' },
    { label: 'Savings rate', value: `${savingsRate}%`, icon: CircleGauge, tone: 'text-brand', note: props.loading ? 'Checking score…' : props.credit ? `Credit score ${props.credit.score}/${CREDIT_MAX_SCORE}` : 'Build a score from activity' },
  ]

  return (
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="Financial overview">
      {cards.map((card, index) => {
        const Icon = card.icon
        return <div key={card.label} className="card-shell animate-fade-up" style={{ animationDelay: `${index * 45}ms` }}><div className="card-inner p-6"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-ink/65">{card.label}</p><span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 ${card.tone}`}><Icon size={19} aria-hidden="true" /></span></div><p className="mt-5 truncate text-2xl font-semibold tracking-[-0.035em] text-ink tabular">{card.value}</p><p className="mt-1.5 text-xs text-ink/50">{card.note}</p></div></div>
      })}
    </section>
  )
}

function CashFlowCard({ summary }: { summary: Summary }) {
  const data = summary.byMonth.map((item) => ({ month: item.month, amount: Number(item.amountMinor) }))
  return <section className="card-shell animate-fade-up"><div className="card-inner h-full p-6"><div className="mb-5 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><CircleDollarSign size={18} aria-hidden="true" /></span><div><h2 className="text-lg font-semibold">Cash flow</h2><p className="text-xs text-ink/50">Monthly recorded activity</p></div></div>{data.length === 0 ? <EmptyState title="No cash flow yet" body="Connect an account or import a statement to see activity over time." /> : <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(112,201,94,0.12)" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#74809a' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#74809a' }} tickFormatter={compactRwf} /><Tooltip formatter={(value) => formatRwf(String(value))} contentStyle={{ borderRadius: 14, border: '1px solid #edf0f6', fontSize: 12 }} /><Line type="monotone" dataKey="amount" stroke="#70C95E" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#70C95E' }} /></LineChart></ResponsiveContainer></div>}</div></section>
}

function ScoreCard(props: {
  credit: CreditScoreResult | null
  loading: boolean
  noScoreYet: boolean
  /** True when the session role is not authorized for credit scoring (403). */
  roleGated: boolean
  accountsCount: number
  computing: boolean
  onCompute: () => void
}) {
  const band = props.credit ? scoreBand(props.credit.score) : null
  const scorePercent = props.credit ? scoreToPercent(props.credit.score) : 0

  return (
    <section className="card-shell animate-fade-up" style={{ animationDelay: '60ms' }}>
      <div className="card-inner flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-ink/60">
              <ShieldCheck size={18} aria-hidden="true" className="text-palm" />
              MSME credit score
            </p>
            {props.loading ? (
              <div className="mt-3 h-12 w-32 animate-pulse rounded-lg bg-ink/10" />
            ) : props.credit ? (
              <>
                <p className="mt-2 text-6xl font-semibold leading-none tracking-tight tabular">
                  {props.credit.score}
                  <span className="text-xl text-ink/40">/{CREDIT_MAX_SCORE}</span>
                </p>
                <p className={`mt-2 text-sm font-semibold ${band!.tone}`}>{band!.label}</p>
              </>
            ) : (
              <p className="mt-3 text-base font-semibold text-ink/70">No score yet</p>
            )}
          </div>
          <span className="rounded-full border border-ink/10 bg-ledger px-3 py-1 text-xs font-medium text-ink/60">
            {props.accountsCount} linked {props.accountsCount === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        {!props.loading && !props.credit && props.roleGated && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-ink/20 bg-ledger p-4">
            <p className="text-sm text-ink/60">
              Credit scoring is an MSME feature — it reads your business cash flow across every
              linked account. If you manage a business, switch your account type to MSME owner to
              compute a score here.
            </p>
          </div>
        )}

        {!props.loading && !props.credit && !props.roleGated && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-ink/20 bg-ledger p-4">
            <p className="text-sm text-ink/60">
              {props.noScoreYet
                ? 'Compute your score from linked cash flow to see your credit standing.'
                : 'Your score is computed from linked accounts and transaction history.'}
            </p>
            <Button size="sm" onClick={props.onCompute} loading={props.computing}>
              {props.computing ? 'Computing…' : 'Compute score'}
            </Button>
          </div>
        )}

        {!props.loading && props.credit && (
          <>
            {/* Signature element: the [300, 850] score mapped onto a strict
                0–100 layout percentage (scoreToPercent) — only the clamped
                percentage reaches the progress track; the raw score stays in
                the number column. */}
            <div>
              <div
                role="img"
                aria-label={`Credit score ${props.credit.score} out of ${CREDIT_MAX_SCORE}`}
              >
                <ProgressBar value={scorePercent} tone="palm" className="h-2" />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-ink/40">
                <span>{CREDIT_MIN_SCORE}</span>
                <span className="tabular text-brand">{scorePercent}% of range</span>
                <span>{CREDIT_MAX_SCORE}</span>
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
                What drives this score
              </p>
              {FACTOR_KEYS.map((key) => {
                const meta = FACTOR_META[key]
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    {/* ProgressBar is the single progress utility — it clamps
                        the normalized display value to [0, 100] and clips the
                        fill inside overflow-hidden rails, so the raw metric
                        (e.g. 154 transactions) can never stretch the bar past
                        its container. The raw text stays in the label column. */}
                    <ProgressBar value={meta.display(props.credit!.factors)} tone="brand" />
                    <span className="text-xs text-ink/60 tabular">
                      {meta.raw(props.credit!.factors)}
                    </span>
                    <span className="col-span-2 -mt-2 text-xs text-ink/50">{meta.label}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function SpendingChartCard(props: { summary: Summary }) {
  const chartData = useMemo(
    () =>
      [...props.summary.byCategory]
        .sort((a, b) => Number(BigInt(b.amountMinor) - BigInt(a.amountMinor)))
        .slice(0, 6)
        .map((entry) => ({
          label: categoryLabel(entry.category),
          amount: Number(entry.amountMinor),
        })),
    [props.summary],
  )

  return (
    <section className="card-shell animate-fade-up" style={{ animationDelay: '120ms' }}>
      <div className="card-inner p-6">
        <div className="mb-4 flex items-center gap-2">
          <Banknote size={20} aria-hidden="true" className="text-brick" />
          <h2 className="text-lg font-semibold">Spending by category</h2>
        </div>

        {chartData.length === 0 ? (
          <EmptyState
            title="No spending yet"
            body="Connect a bank or upload a statement to see your category breakdown."
          />
        ) : (
          <div className="grid items-center gap-3 sm:grid-cols-[minmax(170px,0.8fr)_1fr]">
            <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="amount" nameKey="label" innerRadius="55%" outerRadius="82%" paddingAngle={3} stroke="none">{chartData.map((entry, index) => <Cell key={entry.label} fill={['#70C95E', '#9BDB8E', '#C2EBB9', '#237a57', '#c88520', '#fe5f55'][index % 6]} />)}</Pie><Tooltip formatter={(value) => formatRwf(String(value))} contentStyle={{ borderRadius: 14, border: '1px solid #edf0f6', fontSize: 12 }} /></PieChart></ResponsiveContainer></div>
            <ul className="space-y-2.5">{chartData.map((entry, index) => <li key={entry.label} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2 text-ink/65"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ['#70C95E', '#9BDB8E', '#C2EBB9', '#237a57', '#c88520', '#fe5f55'][index % 6] }} />{entry.label}</span><span className="shrink-0 font-medium text-ink tabular">{compactRwf(entry.amount)}</span></li>)}</ul>
          </div>
        )}
      </div>
    </section>
  )
}

function AlertsCard(props: { alerts: Array<{ tone: string; title: string; body: string }> }) {
  return (
    <section className="card-shell animate-fade-up" style={{ animationDelay: '180ms' }}>
      <div className="card-inner p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={20} aria-hidden="true" className="text-maize" />
          <h2 className="text-lg font-semibold">Alerts</h2>
        </div>

        {props.alerts.length === 0 ? (
          <EmptyState
            title="All quiet"
            body="Connect accounts to get alerts about spending patterns."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {props.alerts.map((alert) => (
              <li
                key={alert.title}
                className="rounded-xl border border-ink/10 bg-ledger p-3.5 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-ink/20"
              >
                <p className={`text-sm font-semibold ${alert.tone}`}>{alert.title}</p>
                <p className="mt-0.5 text-sm text-ink/65">{alert.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function AccountsCard(props: {
  accounts: Account[]
  balances: Map<string, { income: bigint; spending: bigint }>
  activeAccountId: string | undefined
  onSelectAccount: (accountId?: string) => void
  onConnect: () => void
}) {
  return (
    <section className="card-shell animate-fade-up" style={{ animationDelay: '100ms' }}>
      <div className="card-inner p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Banknote size={20} aria-hidden="true" className="text-brand" />
            <h2 className="text-lg font-semibold">Accounts</h2>
          </div>
          <button
            onClick={() => props.onSelectAccount(undefined)}
            className={`rounded-full px-3 py-1 text-xs font-semibold outline-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand/20 ${
              props.activeAccountId === undefined
                ? 'bg-ink text-white'
                : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
            }`}
          >
            All
          </button>
        </div>

        {props.accounts.length === 0 ? (
          <EmptyState
            title="No linked accounts"
            body="Connect a bank via Plaid or upload a mobile-money statement to get started."
            action={<Button size="sm" onClick={props.onConnect}>Connect account</Button>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {props.accounts.map((account) => {
              const Icon = SOURCE_ICONS[account.source]
              const balance = props.balances.get(account.id)
              const net = balance ? balance.income - balance.spending : 0n
              const active = props.activeAccountId === account.id

              return (
                <li key={account.id}>
                  <button
                    onClick={() => props.onSelectAccount(active ? undefined : account.id)}
                    className={`w-full rounded-2xl border p-4 text-left outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand/20 ${
                      active
                        ? 'border-palm/50 bg-palm/[0.04]'
                        : 'border-ink/10 bg-white hover:-translate-y-0.5 hover:border-ink/25'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5">
                        <Icon size={20} aria-hidden="true" className="text-brand" />
                        <span className="font-semibold">{account.institution}</span>
                      </span>
                      <Badge tone={account.source === 'plaid_bank' ? 'brand' : account.source === 'momo_csv' ? 'maize' : 'neutral'}>
                        {SOURCE_LABELS[account.source]}
                      </Badge>
                    </span>
                    <span className="mt-3 block font-mono text-lg font-medium tabular">
                      {formatRwf(net)}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink/50">
                      {account.lastSyncedAt
                        ? `Synced ${formatDate(account.lastSyncedAt)}`
                        : 'Statement import'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function TransactionsCard(props: {
  transactions: Transaction[]
  activeAccountId: string | undefined
}) {
  return (
    <section className="card-shell animate-fade-up" style={{ animationDelay: '160ms' }}>
      <div className="card-inner p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Banknote size={20} aria-hidden="true" className="text-brand" />
            <h2 className="text-lg font-semibold">Recent transactions</h2>
          </div>
          <span className="text-xs text-ink/50">{props.transactions.length} shown</span>
        </div>

        {props.transactions.length === 0 ? (
          <EmptyState
            title="No transactions"
            body="Once you connect an account, the feed appears here — labeled by source."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-ink/10">
            {props.transactions.slice(0, 8).map((transaction) => {
              const meta = categoryMeta(transaction.category)
              const isIncome = BigInt(transaction.amountMinor) > 0n

              return (
                <li key={transaction.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{transaction.merchantName}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/55">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          {transaction.account.institution}
                          <span className="rounded bg-ink/5 px-1 py-px text-[10px] font-medium text-ink/50">
                            {SOURCE_LABELS[transaction.account.source]}
                          </span>
                        </span>
                        <span aria-hidden="true">·</span>
                        {formatDate(transaction.occurredAt)}
                      </p>
                    </div>
                    <p
                      className={`font-mono text-sm font-semibold tabular ${
                        isIncome ? 'text-palm' : 'text-ink'
                      }`}
                    >
                      {formatSignedRwf(transaction.amountMinor)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[1fr_380px]"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-col gap-6">
        <div className="h-64 animate-pulse rounded-[24px] bg-neutral-300" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-neutral-300" />
          <div className="h-72 animate-pulse rounded-2xl bg-neutral-300" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="h-56 animate-pulse rounded-2xl bg-neutral-300" />
        <div className="h-80 animate-pulse rounded-[24px] bg-neutral-300" />
      </div>
    </div>
  )
}
