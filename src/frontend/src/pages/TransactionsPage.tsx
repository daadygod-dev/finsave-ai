import { useMemo, useState } from 'react'
import { ArrowLeftRight, ChevronLeft, ChevronRight, Search, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { api } from '../api/endpoints'
import type { Account, Summary, Transaction, TransactionCategory } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { DatePicker } from '../components/ui/DatePicker'
import { FilterSelect } from '../components/ui/FilterSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { CATEGORY_META, TRANSACTION_CATEGORIES, categoryLabel, categoryMeta } from '../lib/categories'
import { SOURCE_LABELS } from '../lib/sources'
import { compactRwf, formatDate, formatRwf, formatSignedRwf } from '../lib/format'

const PAGE_SIZE = 20

export function TransactionsPage() {
  const toast = useToast()
  const [accountId, setAccountId] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<TransactionCategory | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [localTransactions, setLocalTransactions] = useState<Transaction[] | null>(null)

  const accounts = useAsync(() => api.accounts(), [])
  // Date filtering is server-side: the backend accepts an inclusive ISO
  // range, so paging stays correct no matter how much history exists.
  const transactions = useAsync(
    () =>
      api.transactions({
        accountId,
        from: from ? new Date(`${from}T00:00:00.000Z`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined,
        limit: 100,
      }),
    [accountId, from, to],
  )
  const summary = useAsync(() => api.summarize(accountId), [accountId])

  const all = localTransactions ?? transactions.data?.transactions ?? []

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return all.filter((transaction) => {
      if (category !== 'all' && transaction.category !== category) return false
      if (query && !transaction.merchantName.toLowerCase().includes(query)) return false
      return true
    })
  }, [all, search, category])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const recategorize = async (id: string, next: TransactionCategory) => {
    try {
      await api.categorize(id, next)
      setLocalTransactions(
        all.map((transaction) =>
          transaction.id === id ? { ...transaction, category: next } : transaction,
        ),
      )
      toast.success('Category updated')
    } catch {
      toast.error('Could not update category', 'The backend rejected the request.')
    }
  }

  if (accounts.loading || transactions.loading) {
    return <TransactionsSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Transactions"
        title="Transaction history"
        description="Every transaction across your linked accounts — search, filter, and recategorize."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search merchant…"
                className="w-full rounded-full border border-ink/15 bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors duration-200 focus:border-lake focus:ring-2 focus:ring-lake/30 sm:w-56"
              />
            </label>

            <FilterSelect
              value={accountId ?? '__all__'}
              onValueChange={(value) => {
                setAccountId(value === '__all__' ? undefined : value)
                setPage(1)
              }}
              label="Filter by account"
              options={[{ value: '__all__', label: 'All accounts' }, ...(accounts.data?.accounts ?? []).map((account: Account) => ({ value: account.id, label: account.institution }))]}
            />

            <FilterSelect
              value={category}
              onValueChange={(value) => {
                setCategory(value as TransactionCategory | 'all')
                setPage(1)
              }}
              label="Filter by category"
              options={[{ value: 'all', label: 'All categories' }, ...TRANSACTION_CATEGORIES.map((item) => ({ value: item, label: CATEGORY_META[item].label }))]}
            />

            <DatePicker value={from} onChange={(value) => { setFrom(value); setPage(1) }} label="From date" />
            <DatePicker value={to} onChange={(value) => { setTo(value); setPage(1) }} label="To date" />
          </div>
        }
      />

      {/* Spending analysis strip — derived from the live summary endpoint */}
      <SpendingAnalysis summary={summary.data} loading={summary.loading} />
      {(from || to) && (
        <p className="-mt-2 text-xs text-ink/45">
          Income and spending above cover your full history — the table below is filtered to the
          selected date range.
        </p>
      )}

      {transactions.error ? (
        <ErrorState
          title="Transactions unavailable"
          message="The backend could not return transactions. Check the API is running and linked accounts exist."
          onRetry={() => transactions.reload()}
        />
      ) : filtered.length === 0 ? (
        <div className="card-shell">
          <div className="card-inner p-6">
            <EmptyState
              icon={<ArrowLeftRight size={22} strokeWidth={1.75} />}
              title={all.length === 0 ? 'No transactions yet' : 'No matches'}
              body={
                all.length === 0
                  ? 'Connect a bank via Plaid or upload a statement to see transactions here.'
                  : 'No transactions match the current search and filters.'
              }
            />
          </div>
        </div>
      ) : (
        <div className="card-shell animate-fade-up">
          <div className="card-inner overflow-hidden">
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                    <th className="px-6 py-3.5 font-semibold">Merchant</th>
                    <th className="px-4 py-3.5 font-semibold">Category</th>
                    <th className="px-4 py-3.5 font-semibold">Account</th>
                    <th className="px-4 py-3.5 font-semibold">Date</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {pageRows.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition-colors duration-200 hover:bg-ledger/70"
                    >
                      <td className="max-w-[16rem] truncate px-6 py-3.5 font-medium text-ink">
                        {transaction.merchantName}
                      </td>
                      <td className="px-4 py-3.5">
                        <CategorySelect
                          value={transaction.category}
                          onChange={(next) => recategorize(transaction.id, next)}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-ink/60">
                          {transaction.account.institution}
                          <Badge tone={transaction.account.source === 'plaid_bank' ? 'lake' : transaction.account.source === 'momo_csv' ? 'maize' : 'neutral'}>
                            {SOURCE_LABELS[transaction.account.source]}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink/55">
                        {formatDate(transaction.occurredAt)}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-right font-mono text-sm font-semibold tabular ${
                          BigInt(transaction.amountMinor) > 0n ? 'text-palm' : 'text-ink'
                        }`}
                      >
                        {formatSignedRwf(transaction.amountMinor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="flex flex-col divide-y divide-ink/10 md:hidden">
              {pageRows.map((transaction) => {
                const isIncome = BigInt(transaction.amountMinor) > 0n
                return (
                  <li key={transaction.id} className="flex flex-col gap-2 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate font-medium text-ink">{transaction.merchantName}</p>
                      <p
                        className={`shrink-0 font-mono text-sm font-semibold tabular ${
                          isIncome ? 'text-palm' : 'text-ink'
                        }`}
                      >
                        {formatSignedRwf(transaction.amountMinor)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CategorySelect
                        value={transaction.category}
                        onChange={(next) => recategorize(transaction.id, next)}
                      />
                      <p className="text-xs text-ink/50">
                        {transaction.account.institution} · {formatDate(transaction.occurredAt)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-6 py-3.5">
              <p className="text-xs text-ink/50">
                {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
                {category !== 'all' || search ? ' (filtered)' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={safePage <= 1}
                  className="rounded-full border border-ink/15 bg-white p-2 text-ink/60 outline-none transition-colors duration-200 hover:border-ink/30 hover:text-ink focus-visible:ring-2 focus-visible:ring-lake disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium text-ink/55 tabular">
                  {safePage} / {pageCount}
                </span>
                <button
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  disabled={safePage >= pageCount}
                  className="rounded-full border border-ink/15 bg-white p-2 text-ink/60 outline-none transition-colors duration-200 hover:border-ink/30 hover:text-ink focus-visible:ring-2 focus-visible:ring-lake disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SpendingAnalysis({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const stats = useMemo(() => {
    if (!summary) return null

    let income = 0n
    let spending = 0n
    const byCategory = new Map<string, bigint>()

    for (const account of summary.byAccount) {
      income += BigInt(account.incomeMinor)
      spending += BigInt(account.spendingMinor)
    }
    for (const entry of summary.byCategory) {
      byCategory.set(entry.category, BigInt(entry.amountMinor))
    }

    const top = [...byCategory.entries()]
      .sort((a, b) => Number(b[1] - a[1]))
      .slice(0, 3)
    const max = top[0] ? top[0][1] : 1n

    return { income, spending, top, max }
  }, [summary])

  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-busy={loading}>
      <div className="card-shell animate-fade-up">
        <div className="card-inner flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-palm/10">
            <TrendingUp size={18} aria-hidden="true" className="text-palm" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">Income</p>
            {loading || !stats ? (
              <Skeleton className="mt-1 h-5 w-24" />
            ) : (
              <p className="truncate font-mono text-base font-semibold tabular text-ink">
                {formatRwf(stats.income)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card-shell animate-fade-up" style={{ animationDelay: '40ms' }}>
        <div className="card-inner flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brick/10">
            <TrendingDown size={18} aria-hidden="true" className="text-brick" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">Spending</p>
            {loading || !stats ? (
              <Skeleton className="mt-1 h-5 w-24" />
            ) : (
              <p className="truncate font-mono text-base font-semibold tabular text-ink">
                {formatRwf(stats.spending)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card-shell animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="card-inner flex flex-col gap-2 p-5">
          <div className="flex items-center gap-2">
            <Wallet size={16} aria-hidden="true" className="text-lake" />
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">
              Top categories
            </p>
          </div>
          {loading || !stats || stats.top.length === 0 ? (
            <p className="text-xs text-ink/45">No spending recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {stats.top.map(([category, amount]) => (
                <li key={category} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-xs text-ink/60">
                    {categoryLabel(category)}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-lake"
                      style={{
                        width: `${Math.max(4, Math.round((Number(amount) / Number(stats.max)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[11px] text-ink/55 tabular">
                    {compactRwf(amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function CategorySelect(props: { value: string; onChange: (category: TransactionCategory) => void }) {
  const meta = categoryMeta(props.value)

  return (
    <select
      value={props.value}
      onChange={(event) => props.onChange(event.target.value as TransactionCategory)}
      aria-label="Transaction category"
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-lake ${
        meta.badge === 'lake'
          ? 'border-lake/25 bg-lake/10 text-lake'
          : meta.badge === 'palm'
            ? 'border-palm/25 bg-palm/10 text-palm'
            : meta.badge === 'maize'
              ? 'border-maize/40 bg-maize/15 text-ink/80'
              : meta.badge === 'brick'
                ? 'border-brick/25 bg-brick/10 text-brick'
                : 'border-ink/10 bg-ink/5 text-ink/60'
      }`}
    >
      {TRANSACTION_CATEGORIES.map((item) => (
        <option key={item} value={item}>
          {CATEGORY_META[item].label}
        </option>
      ))}
    </select>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-24 animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]" />
      <div className="card-shell">
        <div className="card-inner flex flex-col gap-3 p-6">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
