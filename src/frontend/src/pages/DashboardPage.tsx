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
  ShieldCheck,
  Smartphone,
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
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { firstName } from '../lib/userProfile'
import { categoryLabel, categoryMeta } from '../lib/categories'
import { SOURCE_LABELS } from '../lib/sources'
import { compactRwf, formatDate, formatRwf, formatSignedRwf } from '../lib/format'

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

const SCORE_BANDS = [
  { label: 'Strong', min: 80, tone: 'text-palm' },
  { label: 'Good', min: 60, tone: 'text-lake' },
  { label: 'Fair', min: 40, tone: 'text-maize' },
  { label: 'Building', min: 0, tone: 'text-brick' },
]

function scoreBand(score: number) {
  return SCORE_BANDS.find((band) => score >= band.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
}

const FACTOR_LABELS: Array<{ key: keyof CreditScoreResult['factors']; label: string }> = [
  { key: 'cashFlowConsistency', label: 'Cash flow consistency' },
  { key: 'transactionVolume', label: 'Transaction volume' },
  { key: 'repaymentHistory', label: 'Repayment history' },
  { key: 'businessStability', label: 'Business stability' },
  { key: 'savingsBehavior', label: 'Savings behavior' },
]

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
  const [computingScore, setComputingScore] = useState(false)

  const { data, error, loading, reload } = useAsync(
    () => fetchDashboard(activeAccountId),
    [activeAccountId],
  )

  const credit = useAsync(() => api.creditScore.get(), [])
  const noScoreYet = credit.error?.code === 'credit_score_not_found'

  const selectAccount = useCallback((accountId?: string) => {
    setActiveAccountId(accountId)
  }, [])

  const computeScore = useCallback(async () => {
    setComputingScore(true)
    try {
      await api.creditScore.compute()
      await credit.reload()
      toast.success('Score computed', 'Your credit score was recalculated from your cash flow.')
    } catch {
      toast.error('Could not compute score', 'Check that the backend is reachable and try again.')
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
        body: `Spending is ${Math.round((Number(spending) / Number(income)) * 100)}% of income this period.`,
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
        <header className="flex flex-col gap-4 border-b border-ink/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              {greeting()}, {firstName(user)}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink/60">
              Your money at a glance — real balances, spending, credit standing, and savings across
              every linked account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={reload}
              className="group"
            >
              <RefreshCw size={16} aria-hidden="true" className="group-hover:rotate-180 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />
              Refresh
            </Button>
            <Button
              onClick={() => setConnectOpen(true)}
              className="group min-w-[164px]"
            >
              <Plus size={16} aria-hidden="true" />
              Connect account
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#bdd5ea] text-[#1e242a] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                <ArrowUpRight size={15} aria-hidden="true" />
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
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
              <SpendingChartCard summary={data.summary} />
              <CashFlowCard summary={data.summary} />
              <TransactionsCard transactions={data.transactions} activeAccountId={activeAccountId} />
            </div>
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <AccountsCard
                accounts={data.accounts}
                balances={balances}
                activeAccountId={activeAccountId}
                onSelectAccount={selectAccount}
                onConnect={() => setConnectOpen(true)}
              />
              <ScoreCard
                credit={credit.data}
                loading={credit.loading}
                noScoreYet={noScoreYet}
                accountsCount={data.accounts.length}
                computing={computingScore}
                onCompute={computeScore}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2"><AlertsCard alerts={alerts} /><CoachCard title="Your AI coach" /></div>
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
  const savingsRate = income > 0n ? Math.max(0, Math.round((Number(balance) / Number(income)) * 100)) : 0
  const cards = [
    { label: 'Net cash flow', value: formatRwf(balance), icon: CircleDollarSign, tone: 'text-lake', note: 'Across linked accounts' },
    { label: 'Income', value: formatRwf(income), icon: Download, tone: 'text-palm', note: 'This reporting period' },
    { label: 'Expenses', value: formatRwf(spending), icon: Banknote, tone: 'text-brick', note: 'This reporting period' },
    { label: 'Savings rate', value: `${savingsRate}%`, icon: CircleGauge, tone: 'text-lake', note: props.loading ? 'Checking score…' : props.credit ? `Credit score ${props.credit.score}/100` : 'Build a score from activity' },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Financial overview">
      {cards.map((card, index) => {
        const Icon = card.icon
        return <div key={card.label} className="card-shell animate-fade-up" style={{ animationDelay: `${index * 45}ms` }}><div className="card-inner p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-ink/65">{card.label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-ledger ${card.tone}`}><Icon size={19} aria-hidden="true" /></span></div><p className="mt-4 truncate text-2xl font-semibold tracking-tight text-ink tabular">{card.value}</p><p className="mt-1 text-xs text-ink/50">{card.note}</p></div></div>
      })}
    </section>
  )
}

function CashFlowCard({ summary }: { summary: Summary }) {
  const data = summary.byMonth.map((item) => ({ month: item.month, amount: Number(item.amountMinor) }))
  return <section className="card-shell animate-fade-up"><div className="card-inner h-full p-6"><div className="mb-5 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake/10 text-lake"><CircleDollarSign size={18} aria-hidden="true" /></span><div><h2 className="text-lg font-semibold">Cash flow</h2><p className="text-xs text-ink/50">Monthly recorded activity</p></div></div>{data.length === 0 ? <EmptyState title="No cash flow yet" body="Connect an account or import a statement to see activity over time." /> : <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(87,115,153,0.13)" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#667a8f' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#667a8f' }} tickFormatter={compactRwf} /><Tooltip formatter={(value) => formatRwf(String(value))} contentStyle={{ borderRadius: 14, border: '1px solid #d7e6f3', fontSize: 12 }} /><Line type="monotone" dataKey="amount" stroke="#577399" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#577399' }} /></LineChart></ResponsiveContainer></div>}</div></section>
}

function ScoreCard(props: {
  credit: CreditScoreResult | null
  loading: boolean
  noScoreYet: boolean
  accountsCount: number
  computing: boolean
  onCompute: () => void
}) {
  const band = props.credit ? scoreBand(props.credit.score) : null
  const segments = props.credit
    ? Array.from({ length: 10 }, (_, index) => index < Math.round(props.credit!.score / 10))
    : []

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
                  <span className="text-xl text-ink/40">/100</span>
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

        {!props.loading && !props.credit && (
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
            {/* Signature element: segmented score ruler */}
            <div>
              <div className="flex gap-1" role="img" aria-label={`Credit score ${props.credit.score} out of 100`}>
                {segments.map((filled, index) => (
                  <div
                    key={index}
                    className={`h-2.5 flex-1 rounded-full transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      filled ? 'bg-palm' : 'bg-ink/10'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] font-medium text-ink/40">
                <span>0</span>
                <span>Building</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Strong</span>
                <span>100</span>
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
                What drives this score
              </p>
              {FACTOR_LABELS.map((factor) => (
                <div key={factor.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-lake transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{ width: `${props.credit!.factors[factor.key]}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-ink/60 tabular">{props.credit!.factors[factor.key]}</span>
                  <span className="col-span-2 -mt-2 text-xs text-ink/50">{factor.label}</span>
                </div>
              ))}
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
            <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="amount" nameKey="label" innerRadius="55%" outerRadius="82%" paddingAngle={3} stroke="none">{chartData.map((entry, index) => <Cell key={entry.label} fill={['#577399', '#768eb0', '#bdd5ea', '#237a57', '#c88520', '#fe5f55'][index % 6]} />)}</Pie><Tooltip formatter={(value) => formatRwf(String(value))} contentStyle={{ borderRadius: 14, border: '1px solid #d7e6f3', fontSize: 12 }} /></PieChart></ResponsiveContainer></div>
            <ul className="space-y-2.5">{chartData.map((entry, index) => <li key={entry.label} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2 text-ink/65"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ['#577399', '#768eb0', '#bdd5ea', '#237a57', '#c88520', '#fe5f55'][index % 6] }} />{entry.label}</span><span className="shrink-0 font-medium text-ink tabular">{compactRwf(entry.amount)}</span></li>)}</ul>
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
            <Banknote size={20} aria-hidden="true" className="text-lake" />
            <h2 className="text-lg font-semibold">Accounts</h2>
          </div>
          <button
            onClick={() => props.onSelectAccount(undefined)}
            className={`rounded-full px-3 py-1 text-xs font-semibold outline-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-lake ${
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
                    className={`w-full rounded-2xl border p-4 text-left outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-lake ${
                      active
                        ? 'border-palm/50 bg-palm/[0.04]'
                        : 'border-ink/10 bg-white hover:-translate-y-0.5 hover:border-ink/25'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5">
                        <Icon size={20} aria-hidden="true" className="text-lake" />
                        <span className="font-semibold">{account.institution}</span>
                      </span>
                      <Badge tone={account.source === 'plaid_bank' ? 'lake' : account.source === 'momo_csv' ? 'maize' : 'neutral'}>
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
            <Banknote size={20} aria-hidden="true" className="text-lake" />
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
        <div className="h-64 animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="h-72 animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]" />
          <div className="h-72 animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="h-56 animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]" />
        <div className="h-80 animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]" />
      </div>
    </div>
  )
}
