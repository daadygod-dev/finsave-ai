import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { authErrorMessage, validateEmail } from '../lib/validators'

export function ForgotPasswordPage() {
  const { resetPassword, configured } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(email.trim())
      setSent(email.trim())
    } catch (submitError) {
      setError(authErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="card-shell">
          <div className="card-inner flex flex-col items-center gap-3 p-6 text-center sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-palm/10">
              <MailCheck size={24} aria-hidden="true" className="text-palm" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">Reset link sent</h2>
            <p className="max-w-sm text-sm leading-relaxed text-ink/55">
              If an account exists for <span className="font-semibold text-ink">{sent}</span>, a
              password reset link is on its way. Follow it to choose a new password.
            </p>
            <Link
              to="/login"
              className="mt-2 text-sm font-medium text-lake outline-none rounded transition-colors duration-200 hover:text-ink focus-visible:ring-2 focus-visible:ring-lake"
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
        <div className="card-inner p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Forgot password</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/55">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {!configured && (
            <p className="mt-4 rounded-lg border border-maize/50 bg-maize/10 px-3 py-2 text-sm text-ink/80">
              Supabase is not configured — add{' '}
              <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> to your environment.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <Field label="Email" htmlFor="forgot-email">
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                invalid={Boolean(error)}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError(null)
                }}
                placeholder="you@example.com"
              />
            </Field>

            {error && (
              <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>

            <p className="text-center text-sm text-ink/55">
              Remembered it?{' '}
              <Link
                to="/login"
                className="font-medium text-lake outline-none rounded transition-colors duration-200 hover:text-ink focus-visible:ring-2 focus-visible:ring-lake"
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
