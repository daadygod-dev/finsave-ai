import { useState } from 'react'
import { Check, ChevronRight, FileUp, Landmark, Settings2, ShieldCheck, Sparkles, Target, UserRound } from 'lucide-react'
import { Button } from '../ui/Button'
import { cx } from '../../lib/cx'

const STEPS = [
  { title: 'Profile setup', detail: 'Confirm the essentials for a more relevant financial workspace.', icon: UserRound },
  { title: 'Connect an account', detail: 'Bring in a bank account or a mobile-money statement.', icon: Landmark },
  { title: 'Preferences', detail: 'Choose how FinSave supports your saving decisions.', icon: Settings2 },
  { title: 'Finish', detail: 'Review your setup and open your dashboard.', icon: Sparkles },
]

type OnboardingDrawerProps = {
  onComplete: () => Promise<void>
}

/** Full-width first-run drawer; completion persists to secure user metadata. */
export function OnboardingDrawer({ onComplete }: OnboardingDrawerProps) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const current = STEPS[step]

  const finish = async () => {
    setSaving(true)
    try {
      await onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-neutral-900/40 p-0 sm:items-center sm:p-6 transition-opacity duration-300" role="dialog" aria-modal="true" aria-label="Account setup">
      <section className="w-full animate-slide-up rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.03)] border-t border-neutral-100 sm:mx-auto sm:max-w-5xl sm:rounded-[24px] sm:animate-fade-up sm:shadow-[0_20px_50px_rgba(0,0,0,0.04)] sm:border border-neutral-200/60 overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-neutral-100 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Account setup</h2>
            <p className="mt-1 text-sm text-neutral-500">Complete a few details to tailor FinSave AI to your money flow.</p>
          </div>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">{step + 1} of {STEPS.length}</span>
        </header>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <ol className="space-y-2.5" aria-label="Setup progress">
            {STEPS.map((item, index) => {
              const Icon = item.icon
              const completed = index < step
              const active = index === step
              return (
                <li key={item.title}>
                  <button type="button" onClick={() => setStep(index)} className={cx('flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand/20', active ? 'border-brand bg-brand/[0.04]' : 'border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/50')} aria-current={active ? 'step' : undefined}>
                    <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors', completed ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-brand text-white' : 'bg-ink/5 text-ink/45')}>
                      {completed ? <Check size={18} aria-hidden="true" className="stroke-[3]" /> : <Icon size={18} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0"><span className={cx('block text-sm font-semibold', active ? 'text-brand' : 'text-neutral-800')}>{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-neutral-400">{item.detail}</span></span>
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="border-t border-neutral-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><current.icon size={20} aria-hidden="true" /></div>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-neutral-900">{current.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{current.detail}</p>
            {step === 1 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 p-4 transition-all hover:border-neutral-300 hover:shadow-sm">
                  <Landmark size={20} className="text-brand" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-neutral-800">Bank account</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">Connect securely through Plaid.</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 p-4 transition-all hover:border-neutral-300 hover:shadow-sm">
                  <FileUp size={20} className="text-brand" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-neutral-800">MoMo or bank statement</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">Import a CSV when you are ready.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
                <p className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <ShieldCheck size={18} className="text-emerald-600" aria-hidden="true" />
                  Your information stays scoped to your account.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400 pl-6">You can change these choices later in Settings.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-neutral-100 px-6 py-4 sm:px-8 bg-neutral-50/50">
          <button type="button" className="text-sm font-semibold text-neutral-500 outline-none hover:text-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-brand/20 rounded-md px-2 py-1" onClick={finish}>Skip for now</button>
          {step === STEPS.length - 1 ? (
            <Button onClick={finish} loading={saving} className="bg-brand hover:bg-brand-bright text-white font-semibold rounded-xl px-5 shadow-sm">
              Open dashboard
            </Button>
          ) : (
            <Button onClick={() => setStep((currentStep) => currentStep + 1)} className="bg-brand hover:bg-brand-bright text-white font-semibold rounded-xl px-5 shadow-sm flex items-center gap-1">
              Continue <ChevronRight size={16} aria-hidden="true" className="mt-0.5" />
            </Button>
          )}
        </footer>
      </section>
    </div>
  )
}
