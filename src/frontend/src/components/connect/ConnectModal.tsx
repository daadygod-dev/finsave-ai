import { useState } from 'react'
import { Landmark, Smartphone, Upload, X } from 'lucide-react'
import { api } from '../../api/endpoints'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { useToast } from '../../context/ToastContext'
import { openPlaidLink } from '../../lib/plaidLink'
import { describeApiError } from '../../lib/apiMessages'

type ConnectMode = 'plaid' | 'csv'

type ConnectModalProps = {
  open: boolean
  onClose: () => void
  onConnected: () => void
}

/**
 * Shared "connect an account" modal: Plaid Link is the primary bank
 * connection; CSV statement upload is the secondary path for mobile money
 * and bank statements.
 */
export function ConnectModal({ open, onClose, onConnected }: ConnectModalProps) {
  const toast = useToast()
  const [mode, setMode] = useState<ConnectMode>('plaid')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // CSV state
  const [source, setSource] = useState<'bank_csv' | 'momo_csv'>('momo_csv')
  const [institution, setInstitution] = useState('MTN MoMo')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileText, setFileText] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setMode('plaid')
    setError(null)
    setConnecting(false)
    setSubmitting(false)
    setFileName(null)
    setFileText(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const connectBank = async () => {
    setError(null)
    setConnecting(true)

    try {
      await openPlaidLink({
        onSuccess: async (publicToken, metadata) => {
          try {
            const { account } = await api.plaid.exchangeToken({
              public_token: publicToken,
              institution: metadata.institution?.name ?? 'Linked bank',
            })
            await api.plaid.syncTransactions(account.id)
            toast.success('Bank connected', `${account.institution} is linked and synced.`)
            reset()
            onConnected()
          } catch (exchangeError) {
            setError(
              describeApiError(
                exchangeError,
                'The bank link succeeded, but the backend could not complete the connection. Try again.',
              ),
            )
            setConnecting(false)
          }
        },
        onExit: () => {
          setConnecting(false)
        },
      })
    } catch (connectError) {
      setError(describeApiError(connectError, 'Could not open Plaid Link. Check that the backend is running and Plaid is configured.'))
      setConnecting(false)
    }
  }

  const onFile = (file: File | undefined) => {
    setError(null)
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => setFileText(String(reader.result ?? ''))
    reader.onerror = () => setError('Could not read that file — try exporting a CSV.')
    reader.readAsText(file)
  }

  const submitCsv = async () => {
    setError(null)

    if (!fileText) {
      setError('Pick a CSV statement file first.')
      return
    }

    if (!institution.trim()) {
      setError('Enter the institution name (e.g. MTN MoMo, Bank of Kigali).')
      return
    }

    setSubmitting(true)

    try {
      const result = await api.uploadCsv({
        source,
        institution: institution.trim(),
        csv: fileText,
      })
      toast.success('Statement imported', `${result.imported} transactions added.`)
      reset()
      onConnected()
    } catch (uploadError) {
      setError(
        describeApiError(
          uploadError,
          'Upload failed. The statement may have no valid rows, or the backend is unreachable.',
        ),
      )
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} label="Connect an account" wide>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Connect an account
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {mode === 'plaid' ? 'Link your bank' : 'Upload a statement'}
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            {mode === 'plaid'
              ? 'Securely link a bank through Plaid to import real transactions.'
              : 'Secondary option — for mobile money (MTN MoMo, Airtel Money) or bank statements.'}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="rounded-full p-2 text-ink/50 outline-none transition-colors duration-300 hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('plaid')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand ${
              mode === 'plaid'
                ? 'border-brand/60 bg-brand/[0.05] text-ink'
                : 'border-ink/10 text-ink/60 hover:border-ink/25'
            }`}
          >
            <Landmark size={18} aria-hidden="true" className="text-brand" />
            Bank Connection
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand ${
              mode === 'csv'
                ? 'border-brand/60 bg-brand/[0.05] text-ink'
                : 'border-ink/10 text-ink/60 hover:border-ink/25'
            }`}
          >
            <Upload size={18} aria-hidden="true" className="text-brand" />
            Upload statement
          </button>
        </div>

        {mode === 'plaid' ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-ink/25 bg-ledger px-4 py-8 text-center">
            <p className="mx-auto max-w-sm text-sm text-ink/60">
              You'll be taken to Bank List to choose your bank and author
              ize read-only access to
              your transactions. The connection is encrypted and stored securely.
            </p>
            <div className="mx-auto mt-1">
              <Button onClick={connectBank} disabled={connecting} size="lg">
                {connecting ? 'Connecting…' : 'Connect a bank'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink/70">Statement type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSource('momo_csv')
                    setInstitution('MTN MoMo')
                  }}
                  className={`rounded-xl border p-3 text-left text-sm font-medium outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand ${
                    source === 'momo_csv'
                      ? 'border-brand/60 bg-brand/[0.05] text-ink'
                      : 'border-ink/10 text-ink/60 hover:border-ink/25'
                  }`}
                >
                  <Smartphone size={18} aria-hidden="true" className="mb-1 text-brand" />
                  Mobile money
                </button>
                <button
                  onClick={() => {
                    setSource('bank_csv')
                    setInstitution('Bank of Kigali')
                  }}
                  className={`rounded-xl border p-3 text-left text-sm font-medium outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand ${
                    source === 'bank_csv'
                      ? 'border-brand/60 bg-brand/[0.05] text-ink'
                      : 'border-ink/10 text-ink/60 hover:border-ink/25'
                  }`}
                >
                  <Landmark size={18} aria-hidden="true" className="mb-1 text-brand" />
                  Bank statement
                </button>
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink/70">Institution name</span>
              <input
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
                className="rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors duration-300 focus:border-brand/50 focus:ring-2 focus:ring-brand/25"
                placeholder="e.g. MTN MoMo"
              />
            </label>

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink/70">CSV file</p>
              <p className="mb-2 text-xs text-ink/45">
                Expected columns: <span className="font-medium text-ink/60">date</span>,{' '}
                <span className="font-medium text-ink/60">merchant</span>,{' '}
                <span className="font-medium text-ink/60">amount</span> — a reference column is
                optional. DD/MM/YYYY or ISO dates are both accepted.
              </p>
              <button
                onClick={() => document.getElementById('csv-file-input')?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-ink/25 bg-ledger px-4 py-8 text-sm text-ink/60 outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-brand hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Upload size={22} aria-hidden="true" className="text-brand" />
                {fileName ? (
                  <span className="font-medium text-ink">{fileName}</span>
                ) : (
                  <span>Choose a .csv statement file</span>
                )}
              </button>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => onFile(event.target.files?.[0])}
              />
            </div>

            <Button onClick={submitCsv} disabled={submitting} size="lg">
              {submitting ? 'Importing…' : 'Import statement'}
            </Button>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
