import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { authErrorMessage, validateConfirmPassword, validatePassword } from '../lib/validators'

/**
 * Handles the Supabase password-recovery link. The email redirects here
 * with either an implicit-flow hash (#access_token/refresh_token) or a PKCE
 * ?code= — both are exchanged for a session, then the new password form is
 * shown.
 */
export function ResetPasswordPage() {
  const { updatePassword, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [processing, setProcessing] = useState(true)
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    async function establishSession() {
      if (!supabase) {
        if (active) setLinkError('Supabase is not configured.')
        if (active) setProcessing(false)
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const code = new URLSearchParams(window.location.search).get('code')

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          setLinkError('This reset link is missing its tokens. Request a new one.')
        }

        // Tokens were consumed to establish the session — remove them from
        // the address bar so they don't linger.
        window.history.replaceState({}, '', '/reset-password')

        if (active) setReady(true)
      } catch {
        if (active) setLinkError('This reset link is invalid or has expired. Request a new one.')
      } finally {
        if (active) setProcessing(false)
      }
    }

    void establishSession()
    return () => {
      active = false
    }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const passwordError = validatePassword(password)
    const confirmError = validateConfirmPassword(password, confirm)
    setFieldErrors({
      password: passwordError ?? undefined,
      confirm: confirmError ?? undefined,
    })

    if (passwordError || confirmError) return

    setSubmitting(true)
    try {
      await updatePassword(password)
      await signOut()
      toast.success('Password updated', 'Sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      setFormError(authErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {processing ? (
        <div className="card-shell">
          <div className="card-inner flex flex-col items-center gap-3 p-6 sm:p-8">
            <Spinner size={24} label="Validating reset link" className="text-palm" />
            <p className="text-sm text-ink/55">Validating your reset link…</p>
          </div>
        </div>
      ) : linkError ? (
        <div className="card-shell">
          <div className="card-inner flex flex-col items-center gap-3 p-6 text-center sm:p-8">
            <p className="text-sm font-semibold text-brick">{linkError}</p>
            <p className="text-sm text-ink/55">
              Request a fresh link and try again — reset links expire quickly.
            </p>
            <Link
              to="/forgot-password"
              className="rounded-full bg-palm px-4 py-2 text-sm font-semibold text-white outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-palm/90 focus-visible:ring-2 focus-visible:ring-lake focus-visible:ring-offset-2 focus-visible:ring-offset-ledger"
            >
              Request a new link
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="card-shell">
          <div className="card-inner p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">Set a new password</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink/55">
              Choose a strong password for your FinSave account.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <Field label="New password" htmlFor="reset-password" error={fieldErrors.password}>
                <Input
                  id="reset-password"
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

              <Field label="Confirm password" htmlFor="reset-confirm" error={fieldErrors.confirm}>
                <Input
                  id="reset-confirm"
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

              {formError && (
                <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
                  {formError}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
