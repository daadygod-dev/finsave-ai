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
            toast.success('Bank connected', `${account.institution} is linked; its initial sync is running in the background.`)
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
      await api.uploadCsv({
        source,
        institution: institution.trim(),
        csv: fileText,
      })
      toast.success('Import started', 'Your statement is being processed in the background.')
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
    <Modal open={open} onClose={handleClose} label="Connect an account" fullPage={false}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Connect an account
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
            {mode === 'plaid' ? 'Link your bank' : 'Upload a statement'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {mode === 'plaid'
              ? 'Securely link a bank through Plaid to import real transactions.'
              : 'Secondary option — for mobile money (MTN MoMo, Airtel Money) or bank statements.'}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="rounded-full p-2 text-neutral-400 outline-none transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-brand/20"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('plaid')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-semibold outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand/20 ${
              mode === 'plaid'
                ? 'border-brand bg-brand/[0.06] text-brand'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Landmark size={18} aria-hidden="true" className={mode === 'plaid' ? 'text-brand' : 'text-neutral-400'} />
            Bank Connection
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-semibold outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand/20 ${
              mode === 'csv'
                ? 'border-brand bg-brand/[0.06] text-brand'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Upload size={18} aria-hidden="true" className={mode === 'csv' ? 'text-brand' : 'text-neutral-400'} />
            Upload statement
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {mode === 'plaid' ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 px-6 py-10 text-center">
            <p className="mx-auto max-w-sm text-sm text-neutral-500 leading-relaxed">
              You'll be taken to Bank List to choose your bank and authorize read-only access to
              your transactions. The connection is encrypted and stored securely.
            </p>
            <div className="mx-auto mt-2 w-full max-w-xs">
              <Button 
                onClick={connectBank} 
                loading={connecting} 
                size="lg" 
                className="w-full bg-brand hover:bg-brand-bright text-white shadow-sm transition-all rounded-xl"
              >
                {connecting ? 'Connecting…' : 'Connect a bank'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-neutral-700">Statement type</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSource('momo_csv')
                    setInstitution('MTN MoMo')
                  }}
                  className={`rounded-xl border p-4 text-left text-sm font-semibold outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand/20 ${
                    source === 'momo_csv'
                      ? 'border-brand bg-brand/[0.06] text-brand'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Smartphone size={20} aria-hidden="true" className={`mb-2 ${source === 'momo_csv' ? 'text-brand' : 'text-neutral-400'}`} />
                  <span className="block font-bold text-neutral-900">Mobile money</span>
                  <span className="block text-xs font-normal text-neutral-400 mt-0.5">MTN, Airtel Money</span>
                </button>
                <button
                  onClick={() => {
                    setSource('bank_csv')
                    setInstitution('Bank of Kigali')
                  }}
                  className={`rounded-xl border p-4 text-left text-sm font-semibold outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-brand/20 ${
                    source === 'bank_csv'
                      ? 'border-brand bg-brand/[0.06] text-brand'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Landmark size={20} aria-hidden="true" className={`mb-2 ${source === 'bank_csv' ? 'text-brand' : 'text-neutral-400'}`} />
                  <span className="block font-bold text-neutral-900">Bank Statement</span>
                  <span className="block text-xs font-normal text-neutral-400 mt-0.5">CSV export sheets</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="institution-input" className="text-sm font-semibold text-neutral-700">
                Institution name
              </label>
              <input
                id="institution-input"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. MTN MoMo, Bank of Kigali"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-neutral-700">Statement file (CSV)</span>
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-6 text-center cursor-pointer transition-colors hover:bg-neutral-50 group">
                <input
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <Upload size={24} className="text-neutral-400 group-hover:text-neutral-500 transition-colors" />
                <span className="text-sm font-semibold text-neutral-700 group-hover:text-neutral-900 transition-colors">
                  {fileName ? fileName : 'Choose a file to upload'}
                </span>
                <span className="text-xs text-neutral-400">Drag and drop or browse local storage</span>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Button 
                
                onClick={handleClose} 
                disabled={submitting}
                className="rounded-xl border border-neutral-200 font-semibold px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={submitCsv}
                loading={submitting}
                disabled={!fileText || !institution.trim()}
                className="bg-brand hover:bg-brand-bright text-white shadow-sm font-semibold rounded-xl px-5 py-2"
              >
                {submitting ? 'Uploading…' : 'Import statement'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
