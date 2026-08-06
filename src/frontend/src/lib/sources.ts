/**
 * Account source labels shared across the dashboard, transactions module,
 * and settings. Mirrors the backend AccountSource enum.
 */
import type { AccountSource } from '../api/types'

export const SOURCE_LABELS: Record<AccountSource, string> = {
  plaid_bank: 'Plaid',
  bank_csv: 'Bank CSV',
  momo_csv: 'MoMo CSV',
}

export const SOURCE_BADGES: Record<AccountSource, 'neutral' | 'palm' | 'brand' | 'maize' | 'brick'> = {
  plaid_bank: 'brand',
  bank_csv: 'neutral',
  momo_csv: 'maize',
}
