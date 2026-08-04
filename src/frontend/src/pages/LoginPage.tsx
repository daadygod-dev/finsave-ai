import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { authErrorMessage, validateEmail, validatePassword } from '../lib/validators'

export function LoginPage() {
  const { signIn, configured } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    setFieldErrors({ email: emailError ?? undefined, password: passwordError ?? undefined })

    if (emailError || passwordError) return

    setSubmitting(true)
    try {
      await signIn(email.trim(), password)

      // Self-healing provisioning: ensure the Prisma User row exists (the
      // backend upserts idempotently, reading the role from the token's
      // user_metadata). Best-effort — a failure surfaces in the dashboard's
      // error state and is retried on the next sign-in.
      try {
        await api.auth.register()
      } catch {
        // Non-blocking: continue to the dashboard; linking retries on the
        // next sign-in. Make the pending state visible instead of silent.
        toast.error('Profile linking pending', 'Your profile will be linked on your next sign-in.')
      }

      toast.success('Signed in', 'Welcome back.')
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(authErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} className="card-shell">
        <div className="card-inner p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/55">
            Enter your email and password to open your FinSave workspace.
          </p>

          {!configured && (
            <p className="mt-4 rounded-lg border border-maize/50 bg-maize/10 px-3 py-2 text-sm text-ink/80">
              Supabase is not configured — add <code className="font-mono text-xs">VITE_SUPABASE_URL</code>{' '}
              and <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> to your
              environment.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <Field label="Email" htmlFor="login-email" error={fieldErrors.email}>
              <Input
                id="login-email"
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

            <Field label="Password" htmlFor="login-password" error={fieldErrors.password}>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                invalid={Boolean(fieldErrors.password)}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setFieldErrors((e) => ({ ...e, password: undefined }))
                }}
                placeholder="••••••••"
              />
            </Field>

            {formError && (
              <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
                {formError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/signup"
                className="font-medium text-brand outline-none transition-colors duration-200 hover:text-[#5a48e8] focus-visible:ring-2 focus-visible:ring-brand rounded"
              >
                Create an account
              </Link>
              <Link
                to="/forgot-password"
                className="font-medium text-brand outline-none transition-colors duration-200 hover:text-[#5a48e8] focus-visible:ring-2 focus-visible:ring-brand rounded"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
