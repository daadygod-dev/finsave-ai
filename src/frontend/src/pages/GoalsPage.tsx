import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { api } from '../api/endpoints'
import type { GoalFeasibility, SavingsGoal } from '../api/types'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { formatDate, formatRwf } from '../lib/format'

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30

function goalProgress(goal: SavingsGoal): number {
  const target = BigInt(goal.targetMinor)
  if (target <= 0n) return 0
  const saved = BigInt(goal.savedMinor)
  return Math.min(100, Math.round((Number(saved) / Number(target)) * 100))
}

function monthsRemaining(goal: SavingsGoal): number {
  return Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / MS_PER_MONTH))
}

function monthlyNeed(goal: SavingsGoal): bigint {
  const months = Math.max(1, monthsRemaining(goal))
  return (BigInt(goal.targetMinor) - BigInt(goal.savedMinor)) / BigInt(months)
}

type GoalFormValues = {
  name: string
  target: string
  date: string
}

export function GoalsPage() {
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(() => api.goals.list(), [])

  const [createOpen, setCreateOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null)
  const [savingGoal, setSavingGoal] = useState<SavingsGoal | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const goals = useMemo(
    () =>
      [...(data?.goals ?? [])].sort(
        (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
      ),
    [data],
  )

  const handleCreated = useCallback(
    (goal: SavingsGoal, feasibility: GoalFeasibility) => {
      if (feasibility.feasible) {
        toast.success('Goal created', `"${goal.name}" is on track with your current surplus.`)
      } else if (feasibility.suggestion === 'extend_timeline' && feasibility.suggestedMonths) {
        toast.error(
          'Goal created — timeline is tight',
          `At your current surplus, aim for ${feasibility.suggestedMonths} months instead.`,
        )
      } else {
        toast.error(
          'Goal created — target may be too high',
          'Your current cash flow shows no surplus to save from.',
        )
      }

      // Refresh the list so the new goal (with its server-side feasibility)
      // appears immediately instead of on the next manual reload.
      void reload()
    },
    [reload, toast],
  )

  const removeGoal = useCallback(
    async (goal: SavingsGoal) => {
      try {
        await api.goals.remove(goal.id)
        toast.success('Goal deleted', `"${goal.name}" was removed.`)
        await reload()
      } catch {
        toast.error('Could not delete goal', 'The backend rejected the request.')
      } finally {
        setConfirmDeleteId(null)
      }
    },
    [reload, toast],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Savings goals"
        title="Goals"
        description="Set a target, watch it progress, and get feasibility guidance from your real cash flow."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            New goal
          </Button>
        }
      />

      {loading ? (
        <GoalsSkeleton />
      ) : error ? (
        <ErrorState
          title="Goals unavailable"
          message="The backend could not return your savings goals."
          onRetry={() => reload()}
        />
      ) : goals.length === 0 ? (
        <div className="card-shell">
          <div className="card-inner p-6">
            <EmptyState
              icon={<Target size={22} strokeWidth={1.75} />}
              title="No savings goals yet"
              body="Create a goal — like a new delivery moto or next season's stock — and track it against your cash flow."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  Create your first goal
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {goals.map((goal, index) => {
            const progress = goalProgress(goal)
            const remaining = monthsRemaining(goal)
            const feasibility = data?.feasibility?.[goal.id]

            const status =
              progress >= 100
                ? { label: 'Reached', chip: 'border-palm/30 bg-palm/10 text-palm' }
                : feasibility?.feasible
                  ? { label: 'On track', chip: 'border-palm/30 bg-palm/10 text-palm' }
                  : feasibility?.suggestion === 'extend_timeline'
                    ? { label: 'Timeline tight', chip: 'border-maize/40 bg-maize/15 text-ink/70' }
                    : feasibility?.suggestion === 'reduce_target'
                      ? { label: 'Above cash flow', chip: 'border-brick/30 bg-brick/10 text-brick' }
                      : { label: `${progress}%`, chip: 'border-ink/10 bg-ledger text-ink/60' }

            return (
              <li
                key={goal.id}
                className="card-shell animate-fade-up"
                style={{ animationDelay: `${Math.min(index, 4) * 50}ms` }}
              >
                <div className="card-inner flex flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold tracking-tight text-ink">
                        {goal.name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/50">
                        Target date {formatDate(goal.targetDate)} ·{' '}
                        {remaining === 0 ? 'due now' : `${remaining} ${remaining === 1 ? 'month' : 'months'} left`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.chip}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-[11px] font-medium text-ink/45 tabular">
                        {progress}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <ProgressBar value={progress} tone={progress >= 100 ? 'palm' : 'brand'} />
                    <div className="mt-2.5 flex items-baseline justify-between gap-3">
                      <p className="font-mono text-sm font-semibold tabular text-ink">
                        {formatRwf(goal.savedMinor)}
                      </p>
                      <p className="text-xs text-ink/50">
                        of <span className="tabular">{formatRwf(goal.targetMinor)}</span>
                      </p>
                    </div>
                  </div>

                  <p className="rounded-xl border border-ink/10 bg-ledger px-3.5 py-2.5 text-xs text-ink/60">
                    {progress >= 100 ? (
                      'Target reached — well done.'
                    ) : feasibility ? (
                      feasibility.feasible ? (
                        <>
                          Save{' '}
                          <span className="font-semibold text-ink tabular">
                            {formatRwf(feasibility.monthlyTargetMinor)}
                          </span>{' '}
                          per month — on course for{' '}
                          <span className="font-semibold text-ink">
                            {formatDate(goal.targetDate)}
                          </span>
                          .
                        </>
                      ) : feasibility.suggestion === 'extend_timeline' &&
                        feasibility.suggestedMonths ? (
                        <>
                          Timeline is tight — at your current surplus, plan for{' '}
                          <span className="font-semibold text-ink tabular">
                            {feasibility.suggestedMonths}
                          </span>{' '}
                          months instead of{' '}
                          <span className="tabular">{feasibility.monthsRemaining}</span>.
                        </>
                      ) : (
                        <>
                          Above your current cash flow — this needs{' '}
                          <span className="font-semibold text-ink tabular">
                            {formatRwf(feasibility.monthlyTargetMinor)}
                          </span>{' '}
                          per month with no surplus to cover it. Reduce the target or grow income
                          first.
                        </>
                      )
                    ) : (
                      <>
                        Save{' '}
                        <span className="font-semibold text-ink tabular">
                          {formatRwf(monthlyNeed(goal))}
                        </span>{' '}
                        per month to hit this target.
                      </>
                    )}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSavingGoal(goal)}>
                      <Plus size={14} aria-hidden="true" />
                      Add savings
                    </Button>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => setEditGoal(goal)} aria-label={`Edit ${goal.name}`}>
                        <Pencil size={14} aria-hidden="true" />
                        Edit
                      </Button>
                      {confirmDeleteId === goal.id ? (
                        <Button variant="danger" size="sm" onClick={() => removeGoal(goal)}>
                          Confirm
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfirmDeleteId(goal.id)
                            window.setTimeout(
                              () => setConfirmDeleteId((current) => (current === goal.id ? null : current)),
                              3000,
                            )
                          }}
                          aria-label={`Delete ${goal.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <CreateGoalModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
      {editGoal && (
        <EditGoalModal
          goal={editGoal}
          onClose={() => setEditGoal(null)}
          onSaved={() => {
            setEditGoal(null)
            void reload()
          }}
        />
      )}
      {savingGoal && (
        <AddSavingsModal
          goal={savingGoal}
          onClose={() => setSavingGoal(null)}
          onSaved={() => {
            setSavingGoal(null)
            void reload()
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

function CreateGoalModal(props: {
  open: boolean
  onClose: () => void
  onCreated: (goal: SavingsGoal, feasibility: GoalFeasibility) => void
}) {
  const toast = useToast()
  const [values, setValues] = useState<GoalFormValues>({ name: '', target: '', date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const name = values.name.trim()
    const target = BigInt(values.target.trim() || '0')
    const date = values.date

    if (!name) return setError('Give the goal a name.')
    if (target <= 0n) return setError('Enter a target amount greater than zero.')
    if (!date) return setError('Pick a target date.')
    if (new Date(`${date}T00:00:00.000Z`).getTime() <= Date.now()) {
      return setError('The target date must be in the future.')
    }

    setSubmitting(true)
    try {
      const result = await api.goals.create({
        name,
        target_minor: target.toString(),
        target_date: new Date(`${date}T00:00:00.000Z`).toISOString(),
      })
      setValues({ name: '', target: '', date: '' })
      props.onClose()
      props.onCreated(result.goal, result.feasibility)
    } catch {
      setError('Could not create the goal — the backend rejected the request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={props.open} onClose={props.onClose} label="New savings goal">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-palm">Savings goal</p>
        <h2 className="mt-1 text-xl font-semibold">New goal</h2>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Goal name" htmlFor="goal-name">
          <Input
            id="goal-name"
            value={values.name}
            onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            placeholder="e.g. New delivery moto"
          />
        </Field>
        <Field label="Target amount (RWF)" htmlFor="goal-target" hint="Whole francs — e.g. 1500000 for 1.5M RWF.">
          <Input
            id="goal-target"
            inputMode="numeric"
            value={values.target}
            onChange={(event) => setValues((v) => ({ ...v, target: event.target.value.replace(/[^\d]/g, '') }))}
            placeholder="1500000"
          />
        </Field>
        <Field label="Target date" htmlFor="goal-date">
          <Input
            id="goal-date"
            type="date"
            value={values.date}
            onChange={(event) => setValues((v) => ({ ...v, date: event.target.value }))}
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating…' : 'Create goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditGoalModal(props: { goal: SavingsGoal; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [values, setValues] = useState<GoalFormValues>({
    name: props.goal.name,
    target: props.goal.targetMinor,
    date: props.goal.targetDate.slice(0, 10),
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const name = values.name.trim()
    const target = BigInt(values.target.trim() || '0')
    const date = values.date

    if (!name) return setError('Give the goal a name.')
    if (target <= 0n) return setError('Enter a target amount greater than zero.')
    if (!date) return setError('Pick a target date.')

    setSubmitting(true)
    try {
      await api.goals.update(props.goal.id, {
        name,
        target_minor: target.toString(),
        target_date: new Date(`${date}T00:00:00.000Z`).toISOString(),
      })
      toast.success('Goal updated')
      props.onSaved()
    } catch {
      setError('Could not update the goal — the backend rejected the request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={props.onClose} label="Edit savings goal">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-palm">Savings goal</p>
        <h2 className="mt-1 text-xl font-semibold">Edit goal</h2>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Goal name" htmlFor="edit-goal-name">
          <Input
            id="edit-goal-name"
            value={values.name}
            onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
          />
        </Field>
        <Field label="Target amount (RWF)" htmlFor="edit-goal-target">
          <Input
            id="edit-goal-target"
            inputMode="numeric"
            value={values.target}
            onChange={(event) => setValues((v) => ({ ...v, target: event.target.value.replace(/[^\d]/g, '') }))}
          />
        </Field>
        <Field label="Target date" htmlFor="edit-goal-date">
          <Input
            id="edit-goal-date"
            type="date"
            value={values.date}
            onChange={(event) => setValues((v) => ({ ...v, date: event.target.value }))}
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AddSavingsModal(props: { goal: SavingsGoal; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const added = BigInt(amount.trim() || '0')
    if (added <= 0n) return setError('Enter an amount greater than zero.')

    setSubmitting(true)
    try {
      const saved = BigInt(props.goal.savedMinor) + added
      await api.goals.update(props.goal.id, { saved_minor: saved.toString() })
      toast.success('Savings recorded', `Added ${formatRwf(added)} to "${props.goal.name}".`)
      props.onSaved()
    } catch {
      setError('Could not record the savings — the backend rejected the request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={props.onClose} label="Add savings">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-palm">Savings goal</p>
        <h2 className="mt-1 text-xl font-semibold">Add savings — {props.goal.name}</h2>
        <p className="mt-1 text-sm text-ink/55">
          Saved so far: <span className="font-semibold text-ink tabular">{formatRwf(props.goal.savedMinor)}</span>{' '}
          of <span className="tabular">{formatRwf(props.goal.targetMinor)}</span>
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Amount to record (RWF)" htmlFor="add-savings-amount">
          <Input
            id="add-savings-amount"
            inputMode="numeric"
            autoFocus
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
            placeholder="50000"
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Recording…' : 'Record savings'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function GoalsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-[1.25rem] border border-ink/10 bg-ink/[0.05]" />
      ))}
    </div>
  )
}
