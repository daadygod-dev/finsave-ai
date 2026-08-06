import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { api } from '../api/endpoints'
import type { UserRole } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { authErrorMessage, validateConfirmPassword, validateEmail, validatePassword } from '../lib/validators'

type FieldErrors = { email?: string; password?: string; confirm?: string }

export function SignUpPage() {
  const { signUp, signOut, configured } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<UserRole>('msme_owner')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const confirmError = validateConfirmPassword(password, confirm)
    setFieldErrors({
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
      confirm: confirmError ?? undefined,
    })

    if (emailError || passwordError || confirmError) return

    setSubmitting(true)
    try {
      // The role is written to Supabase user metadata by signUp; the backend
      // reads it back from the verified token during provisioning.
      const { needsEmailConfirmation } = await signUp(email.trim(), password, role)

      if (needsEmailConfirmation) {
        // Email verification is enabled: the /auth/confirm callback
        // provisions the User row after the OTP is verified.
        setCheckEmail(email.trim())
        return
      }

      // Session established immediately — provision the User row via the
      // backend, never client-side.
      try {
        await api.auth.register()
      } catch {
        // Sign out so the next sign-in re-attempts the linking (LoginPage
        // calls register again). Never silently keep an unlinked account.
        await signOut()
        setFormError(
          'Your account was created, but linking it to FinSave failed. Please sign in again — linking is retried automatically.',
        )
        return
      }

      toast.success('Account created', 'Welcome to FinSave AI.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(authErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (checkEmail) {
    return (
      <AuthLayout>
        <div className="card-shell">
          <div className="card flex flex-col items-center gap-3 p-6 text-center sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
              <MailCheck size={24} aria-hidden="true" className="text-brand" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">Check your email</h2>
            <p className="max-w-sm text-sm leading-relaxed text-ink/55">
              We sent a verification link to <span className="font-semibold text-ink">{checkEmail}</span>.
              Click it to confirm your email and finish setting up your account.
            </p>
            <p className="text-xs text-ink/45">Didn't get it? Check spam, or try signing up again.</p>
            <Link
              to="/login"
              className="mt-2 text-sm font-medium text-brand outline-none rounded transition-colors duration-200 hover:text-brand-deep focus-visible:ring-2 focus-visible:ring-brand"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} className="card-shell">
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Create your account</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/55">
            Sign up to track spending, savings goals, and your credit standing.
          </p>

          {!configured && (
            <p className="mt-4 rounded-lg border border-maize/50 bg-maize/10 px-3 py-2 text-sm text-ink/80">
              Supabase is not configured — add <code className="font-mono text-xs">VITE_SUPABASE_URL</code>{' '}
              and <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> to your
              environment.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <Field label="Email" htmlFor="signup-email" error={fieldErrors.email}>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                invalid={Boolean(fieldErrors.email)}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setFieldErrors((e) => ({ ...e, email: undefined }))
                }}
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password" htmlFor="signup-password" error={fieldErrors.password}>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                invalid={Boolean(fieldErrors.password)}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setFieldErrors((e) => ({ ...e, password: undefined }))
                }}
                placeholder="At least 8 characters"
              />
            </Field>

            <Field label="Confirm password" htmlFor="signup-confirm" error={fieldErrors.confirm}>
              <Input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                invalid={Boolean(fieldErrors.confirm)}
                onChange={(event) => {
                  setConfirm(event.target.value)
                  setFieldErrors((e) => ({ ...e, confirm: undefined }))
                }}
                placeholder="Repeat your password"
              />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink/70">Account type</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'msme_owner', label: 'MSME owner', hint: 'A business' },
                    { value: 'individual', label: 'Individual', hint: 'Personal' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    className={`rounded-xl border p-3 text-left outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand ${
                      role === option.value
                        ? 'border-brand/60 bg-brand/[0.05]'
                        : 'border-ink/10 hover:border-ink/25'
                    }`}
                    aria-pressed={role === option.value}
                  >
                    <p className="text-sm font-semibold text-ink">{option.label}</p>
                    <p className="text-xs text-ink/50">{option.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
                {formError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-ink/55">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-brand outline-none rounded transition-colors duration-200 hover:text-brand-deep focus-visible:ring-2 focus-visible:ring-brand"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
