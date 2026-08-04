import { useCallback, useState, type FormEvent } from 'react'
import {
  Bell,
  KeyRound,
  Landmark,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCircle2,
  Wallet,
} from 'lucide-react'
import { api } from '../api/endpoints'
import type { Account, AccountSource } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConnectModal } from '../components/connect/ConnectModal'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth, type AuthUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { SOURCE_BADGES, SOURCE_LABELS } from '../lib/sources'
import { displayName } from '../lib/userProfile'
import { formatDate } from '../lib/format'
import { supabase } from '../lib/supabase'

const SOURCE_ICONS: Record<AccountSource, typeof Landmark> = {
  plaid_bank: Landmark,
  bank_csv: Landmark,
  momo_csv: Smartphone,
}

export function SettingsPage() {
  const { user, signOut, updateProfile } = useAuth()
  const toast = useToast()

  const me = useAsync(() => api.session.me(), [])
  const accounts = useAsync(() => api.accounts(), [])
  const [connectOpen, setConnectOpen] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const syncAccount = useCallback(
    async (account: Account) => {
      if (account.source !== 'plaid_bank') return
      setSyncingId(account.id)
      try {
        const result = await api.plaid.syncTransactions(account.id)
        toast.success('Account synced', `${result.imported} new transactions from ${account.institution}.`)
        void accounts.reload()
      } catch {
        toast.error('Sync failed', 'The bank rejected this sync — reconnect the account if it keeps failing.')
      } finally {
        setSyncingId(null)
      }
    },
    [accounts, toast],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Account & security"
        description="Your profile, session security, connected services, and preferences — all backed by your real identity and data."
      />

      {/* Profile */}
      <section className="card-shell animate-fade-up">
        <div className="card-inner flex flex-col gap-5 p-6">
          <div className="flex items-center gap-2">
            <UserCircle2 size={20} aria-hidden="true" className="text-lake" />
            <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">Name</p>
              <p className="mt-1 truncate font-semibold text-ink">{displayName(user)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">Email</p>
              <p className="mt-1 truncate font-semibold text-ink">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">
                Account type
              </p>
              <p className="mt-1 capitalize text-ink">
                {me.data ? me.data.role.replace('_', ' ') : '…'}
              </p>
            </div>
          </div>

          <ProfileNameForm onSaved={(name) => toast.success('Profile updated', `Display name is now "${name}".`)} />
        </div>
      </section>

      {/* Security */}
      <section className="card-shell animate-fade-up" style={{ animationDelay: '50ms' }}>
        <div className="card-inner flex flex-col gap-5 p-6">
          <div className="flex items-center gap-2">
            <KeyRound size={20} aria-hidden="true" className="text-lake" />
            <h2 className="text-lg font-semibold tracking-tight">Security</h2>
          </div>

          <ChangePasswordForm />

          <div className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-ledger p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} aria-hidden="true" className="text-palm" />
                <div>
                  <p className="text-sm font-semibold text-ink">Current session</p>
                  <p className="text-xs text-ink/55">
                    Signed in as {user?.email} · verified by the backend
                  </p>
                </div>
              </div>
              <Badge>Active</Badge>
            </div>
            <p className="text-xs text-ink/45">
              Session management is handled by Supabase Auth — your session refreshes automatically.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <p className="text-sm text-ink/60">Sign out of this device</p>
            <Button
              variant="danger"
              onClick={() => {
                void signOut()
                toast.info('Signed out')
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </section>

      {/* Connected services */}
      <section className="card-shell animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="card-inner p-6">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Landmark size={20} aria-hidden="true" className="text-lake" />
              <h2 className="text-lg font-semibold tracking-tight">Connected services</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setConnectOpen(true)}>
              Connect account
            </Button>
          </div>
          <p className="mt-1 text-sm text-ink/55">
            Every money source feeding your dashboard, score, and goals.
          </p>

          <div className="mt-5">
            {accounts.loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : accounts.error ? (
              <ErrorState
                title="Accounts unavailable"
                message="The backend could not return your linked accounts."
                onRetry={() => accounts.reload()}
              />
            ) : (accounts.data?.accounts ?? []).length === 0 ? (
              <EmptyState
                title="No linked accounts"
                body="Connect a bank via Plaid or upload a statement to start feeding your dashboard."
                action={<Button size="sm" onClick={() => setConnectOpen(true)}>Connect an account</Button>}
              />
            ) : (
              <ul className="flex flex-col divide-y divide-ink/10">
                {(accounts.data?.accounts ?? []).map((account) => {
                  const Icon = SOURCE_ICONS[account.source]
                  const syncing = syncingId === account.id
                  const isPlaid = account.source === 'plaid_bank'

                  return (
                    <li key={account.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lake/10">
                          <Icon size={18} aria-hidden="true" className="text-lake" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{account.institution}</p>
                          <p className="text-xs text-ink/50">
                            {account.lastSyncedAt
                              ? `Last synced ${formatDate(account.lastSyncedAt)}`
                              : 'Statement import'}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={SOURCE_BADGES[account.source]}>
                          {SOURCE_LABELS[account.source]}
                        </Badge>
                        {isPlaid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => syncAccount(account)}
                            disabled={syncing}
                            aria-label={`Sync ${account.institution}`}
                          >
                            <RefreshCw size={14} aria-hidden="true" className={syncing ? 'animate-spin' : ''} />
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <p className="mt-4 rounded-xl border border-ink/10 bg-ledger px-3.5 py-2.5 text-xs text-ink/55">
            Bank connections are read-only: FinSave AI can see transaction history to compute your
            dashboard and score, and can never move money. Lender access to your score only ever
            happens through an explicit consent grant on the lender portal.
          </p>
        </div>
      </section>

      {/* Preferences */}
      <PreferencesSection />

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={() => {
          setConnectOpen(false)
          void accounts.reload()
        }}
      />
    </div>
  )
}

function ProfileNameForm({ onSaved }: { onSaved: (name: string) => void }) {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.fullName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return setError('Enter a display name.')

    setSaving(true)
    try {
      await updateProfile({ name: trimmed })
      onSaved(trimmed)
    } catch {
      setError('Could not save the name — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t border-ink/10 pt-4">
      <Field label="Display name" htmlFor="profile-name" hint="Stored in your Supabase identity metadata — shown in the dashboard greeting.">
        <Input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Jaylon Baptista"
        />
      </Field>
      {error && (
        <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save name'}
        </Button>
      </div>
    </form>
  )
}

function ChangePasswordForm() {
  const { updatePassword } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (next.length < 8) return setError('The new password must be at least 8 characters.')
    if (next !== confirm) return setError('The new passwords do not match.')

    setSaving(true)
    try {
      // Re-verify the current password against Supabase Auth before changing
      // it — a real credential check, not a client-side guess.
      if (supabase) {
        const session = await supabase.auth.getSession()
        const email = session.data.session?.user.email
        if (!email) {
          setError('No active session — sign in again to change your password.')
          setSaving(false)
          return
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email,
          password: current,
        })
        if (verifyError) {
          setError('The current password is incorrect.')
          setSaving(false)
          return
        }
      }

      await updatePassword(next)
      toast.success('Password changed', 'Your password was updated. Use it on your next sign-in.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch {
      setError('Could not change the password — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
      <Field label="Current password" htmlFor="pw-current">
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </Field>
      <Field label="New password" htmlFor="pw-new" hint="At least 8 characters">
        <Input
          id="pw-new"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="pw-confirm">
        <Input
          id="pw-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </Field>

      {error && (
        <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick sm:col-span-3">
          {error}
        </p>
      )}

      <div className="sm:col-span-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Changing…' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}

function PreferencesSection() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState<keyof NonNullable<AuthUser>['preferences'] | null>(null)

  const toggle = async (key: 'notifications' | 'aiCoaching', value: boolean) => {
    setSaving(key)
    try {
      await updateProfile({ [key]: value })
      toast.success(
        key === 'notifications' ? 'Notifications updated' : 'AI coaching updated',
        value ? 'Enabled.' : 'Disabled.',
      )
    } catch {
      toast.error('Could not save the preference', 'Check your connection and try again.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <section className="card-shell animate-fade-up" style={{ animationDelay: '150ms' }}>
      <div className="card-inner p-6">
        <div className="flex items-center gap-2">
          <Settings size={20} aria-hidden="true" className="text-lake" />
          <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          Stored in your identity profile — applied everywhere you're signed in.
        </p>

        <div className="mt-5 flex flex-col divide-y divide-ink/10">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake/10">
                <Wallet size={16} aria-hidden="true" className="text-lake" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Currency</p>
                <p className="text-xs text-ink/55">RWF — the platform currency for all amounts.</p>
              </div>
            </div>
            <Badge>RWF</Badge>
          </div>

          <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake/10">
                <Bell size={16} aria-hidden="true" className="text-lake" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Notifications</p>
                <p className="text-xs text-ink/55">Alerts about spending and savings milestones.</p>
              </div>
            </div>
            <Toggle
              checked={user?.preferences.notifications ?? true}
              disabled={saving === 'notifications'}
              onChange={(value) => toggle('notifications', value)}
              label="Notifications"
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake/10">
                <Sparkles size={16} aria-hidden="true" className="text-lake" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">AI coaching</p>
                <p className="text-xs text-ink/55">
                  Personalized insights on the dashboard, built from your real cash flow.
                </p>
              </div>
            </div>
            <Toggle
              checked={user?.preferences.aiCoaching ?? true}
              disabled={saving === 'aiCoaching'}
              onChange={(value) => toggle('aiCoaching', value)}
              label="AI coaching"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full outline-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-lake focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 ${
        checked ? 'bg-palm' : 'bg-ink/15'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
