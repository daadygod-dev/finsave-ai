import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { api } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { authErrorMessage } from '../lib/validators'

/**
 * Email-verification callback. Supabase emails link to
 * /auth/confirm?token_hash=…&type=signup (PKCE). Verifies the OTP, then
 * provisions the application User row through the backend.
 */
export function ConfirmEmailPage() {
  const { verifyEmailOtp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionFailed, setProvisionFailed] = useState(false)

  const provisionUser = useCallback(async () => {
    // The backend reads the role from the verified token's user_metadata.
    await api.auth.register()
  }, [])

  const finish = useCallback(async () => {
    setProvisioning(true)
    try {
      await provisionUser()
      toast.success('Email confirmed', 'Your account is ready.')
      navigate('/dashboard', { replace: true })
    } catch {
      setProvisionFailed(true)
      setError(
        'Your email is confirmed, but linking the account to FinSave failed. Retry, or sign in — linking is retried automatically on your next sign-in.',
      )
      setProvisioning(false)
      setProcessing(false)
    }
  }, [navigate, provisionUser, toast])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type')

    async function confirm() {
      if (!tokenHash || !type) {
        setError('This verification link is incomplete. Try signing up again.')
        setProcessing(false)
        return
      }

      try {
        await verifyEmailOtp(tokenHash, type)
        await finish()
      } catch (verifyError) {
        setError(authErrorMessage(verifyError))
        setProcessing(false)
      }
    }

    void confirm()
  }, [finish, verifyEmailOtp])

  return (
    <AuthLayout>
      <div className="card-shell">
        <div className="card-inner flex flex-col items-center gap-3 p-6 text-center sm:p-8">
          {processing ? (
            <>
              <Spinner size={24} label="Confirming email" className="text-brand" />
              <p className="text-sm text-ink/55">Confirming your email…</p>
            </>
          ) : error ? (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brick/10">
                <MailCheck size={24} aria-hidden="true" className="text-brick" />
              </span>
              <p className="text-sm font-semibold text-ink/80">Could not confirm your email</p>
              <p className="max-w-sm text-sm leading-relaxed text-ink/55">{error}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {provisionFailed && (
                  <Button size="sm" onClick={() => void finish()} disabled={provisioning}>
                    {provisioning ? 'Linking…' : 'Retry linking'}
                  </Button>
                )}
                <Link
                  to="/login"
                  className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-xs font-semibold text-ink/80 outline-none transition-colors duration-200 hover:border-ink/30 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Go to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
                <MailCheck size={24} aria-hidden="true" className="text-brand" />
              </span>
              <p className="text-sm text-ink/55">Finishing setup…</p>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
