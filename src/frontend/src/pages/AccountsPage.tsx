import { useCallback, useMemo, useState } from 'react'
import { Landmark, Link2, Plus, RefreshCw, Smartphone } from 'lucide-react'
import { api } from '../api/endpoints'
import { ApiError } from '../api/client'
import type { Account, AccountSource, Summary } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConnectModal } from '../components/connect/ConnectModal'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { SOURCE_BADGES, SOURCE_LABELS } from '../lib/sources'
import { formatDate, formatRwf } from '../lib/format'

const SOURCE_ICONS: Record<AccountSource, typeof Landmark> = {
  plaid_bank: Landmark,
  bank_csv: Landmark,
  momo_csv: Smartphone,
}

type AccountBalances = Map<string, { income: bigint; spending: bigint }>

function syncErrorMessage(error: ApiError | null): string {
  if (!error) return ''
  switch (error.code) {
    case 'plaid_not_configured':
      return 'Plaid is not configured on the server — the sync key is missing.'
    case 'account_not_synced':
      return 'This account has no bank connection to sync.'
    case 'ITEM_LOGIN_REQUIRED':
    case 'item_login_required':
      return 'The bank link has expired — reconnect the bank to keep syncing.'
    default:
      return error.status >= 400 && error.status < 500
        ? 'The bank rejected this sync. Reconnect the account to restore it.'
        : 'Sync failed — check the server logs and try again.'
  }
}

export function AccountsPage() {
  const toast = useToast()
  const [connectOpen, setConnectOpen] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({})

  const accounts = useAsync(() => api.accounts(), [])
  const summary = useAsync<Summary | null>(async () => {
    try {
      return await api.summarize()
    } catch {
      // A failed summary must not block the accounts list itself.
      return null
    }
  }, [])

  const list = accounts.data?.accounts ?? []

  const balances: AccountBalances = useMemo(() => {
    const map: AccountBalances = new Map()
    for (const entry of summary.data?.byAccount ?? []) {
      map.set(entry.accountId, {
        income: BigInt(entry.incomeMinor),
        spending: BigInt(entry.spendingMinor),
      })
    }
    return map
  }, [summary.data])

  const totals = useMemo(() => {
    let net = 0n
    let plaid = 0
    let csv = 0
    for (const account of list) {
      const balance = balances.get(account.id)
      if (balance) net += balance.income - balance.spending
      if (account.source === 'plaid_bank') plaid += 1
      else csv += 1
    }
    return { net, plaid, csv }
  }, [list, balances])

  const sync = useCallback(
    async (account: Account) => {
      if (account.source !== 'plaid_bank') return

      setSyncingId(account.id)
      setSyncErrors((current) => ({ ...current, [account.id]: '' }))
      try {
        const result = await api.plaid.syncTransactions(account.id)
        toast.success(
          'Account synced',
          `${result.imported} new transaction${result.imported === 1 ? '' : 's'} imported from ${account.institution}.`,
        )
        void accounts.reload()
        void summary.reload()
      } catch (error) {
        setSyncErrors((current) => ({
          ...current,
          [account.id]: syncErrorMessage(error instanceof ApiError ? error : null),
        }))
      } finally {
        setSyncingId(null)
      }
    },
    [accounts, summary, toast],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Accounts"
        title="Your money sources"
        description="Every linked bank and mobile-money account feeding your dashboard, score, and goals."
        actions={
          <Button onClick={() => setConnectOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Connect account
          </Button>
        }
      />

      {accounts.loading || summary.loading ? (
        <AccountsSkeleton />
      ) : accounts.error ? (
        <ErrorState
          title="Accounts unavailable"
          message="The backend could not return your linked accounts."
          onRetry={() => {
            void accounts.reload()
            void summary.reload()
          }}
        />
      ) : list.length === 0 ? (
        <div className="card-shell animate-fade-up">
          <div className="card-inner p-6">
            <EmptyState
              icon={<Link2 size={22} strokeWidth={1.75} />}
              title="No accounts connected"
              body="Connect a bank through Plaid for live transactions, or upload a mobile-money or bank statement as a secondary source."
              action={
                <Button onClick={() => setConnectOpen(true)}>
                  Connect your first account
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <>
          {/* Totals strip */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-shell animate-fade-up">
              <div className="card-inner p-5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">
                  Combined balance
                </p>
                <p className="mt-1.5 font-mono text-xl font-semibold tabular text-ink">
                  {formatRwf(totals.net)}
                </p>
                <p className="text-[11px] text-ink/45">RWF across all linked accounts</p>
              </div>
            </div>
            <div className="card-shell animate-fade-up" style={{ animationDelay: '50ms' }}>
              <div className="card-inner p-5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">
                  Bank connections
                </p>
                <p className="mt-1.5 font-mono text-xl font-semibold tabular text-ink">
                  {totals.plaid}
                </p>
                <p className="text-[11px] text-ink/45">via Plaid Link</p>
              </div>
            </div>
            <div className="card-shell animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="card-inner p-5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">
                  Statement imports
                </p>
                <p className="mt-1.5 font-mono text-xl font-semibold tabular text-ink">
                  {totals.csv}
                </p>
                <p className="text-[11px] text-ink/45">bank / mobile-money CSV</p>
              </div>
            </div>
          </div>

          {/* Account cards */}
          <ul className="grid gap-5 md:grid-cols-2">
            {list.map((account, index) => {
              const Icon = SOURCE_ICONS[account.source]
              const balance = balances.get(account.id)
              const net = balance ? balance.income - balance.spending : 0n
              const isPlaid = account.source === 'plaid_bank'
              const error = syncErrors[account.id]
              const syncing = syncingId === account.id

              return (
                <li
                  key={account.id}
                  className="card-shell animate-fade-up"
                  style={{ animationDelay: `${Math.min(index, 4) * 50}ms` }}
                >
                  <div className="card-inner flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lake/10">
                          <Icon size={20} aria-hidden="true" className="text-lake" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{account.institution}</p>
                          <p className="text-xs text-ink/50">
                            {account.source === 'plaid_bank'
                              ? 'Connected bank account'
                              : account.source === 'momo_csv'
                                ? 'Mobile money statement'
                                : 'Bank statement import'}
                          </p>
                        </div>
                      </div>
                      <Badge tone={SOURCE_BADGES[account.source]}>
                        {SOURCE_LABELS[account.source]}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink/45">
                          Current balance
                        </p>
                        <p className="mt-1 font-mono text-2xl font-semibold tabular text-ink">
                          {formatRwf(net)}
                        </p>
                      </div>
                      <p className="text-xs text-ink/50">
                        {account.lastSyncedAt ? (
                          <>
                            Last synced{' '}
                            <span className="font-medium text-ink/70">
                              {formatDate(account.lastSyncedAt)}
                            </span>
                          </>
                        ) : isPlaid ? (
                          'Never synced'
                        ) : (
                          'Statement import'
                        )}
                      </p>
                    </div>

                    {error && (
                      <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-xs text-brick">
                        {error}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 border-t border-ink/10 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-ink/45">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            error ? 'bg-brick' : account.lastSyncedAt ? 'bg-palm' : 'bg-maize'
                          }`}
                        />
                        {error
                          ? 'Needs attention'
                          : isPlaid
                            ? account.lastSyncedAt
                              ? 'Connected'
                              : 'Awaiting first sync'
                            : 'Import complete'}
                      </span>
                      {isPlaid && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => sync(account)}
                          disabled={syncing}
                        >
                          <RefreshCw
                            size={14}
                            aria-hidden="true"
                            className={syncing ? 'animate-spin' : ''}
                          />
                          {syncing ? 'Syncing…' : 'Sync'}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={() => {
          setConnectOpen(false)
          void accounts.reload()
          void summary.reload()
        }}
      />
    </div>
  )
}

function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading accounts">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}
