/**
 * Statement CSV parsing shared by the bank_csv and momo_csv ingestion paths.
 *
 * The Phase 1 verification explicitly requires that malformed/irregular CSV
 * rows never crash the parser (PLANS.md Phase 1) — real MoMo and bank
 * statements vary in header casing, date formats, and amount formatting, so
 * the parser is tolerant:
 * - headers are trimmed/lowercased,
 * - unknown columns are ignored,
 * - rows with unparseable dates or amounts are skipped and counted,
 * - DD/MM/YYYY (MoMo style) and ISO dates are both accepted,
 * - amounts may include thousand separators, spaces, or an RWF suffix.
 */
import Papa from 'papaparse'
import { z } from 'zod'

export type StatementRow = {
  date: string
  merchant: string
  amountMinor: bigint
  externalId?: string
}

export type ParseResult = {
  rows: StatementRow[]
  skipped: number
}

const rowSchema = z.object({
  date: z.string().min(1),
  merchant: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  external_id: z.string().optional(),
})

// Real bank and MoMo statements use different headers for the same fields;
// normalize them so one parser handles both formats.
const FIELD_ALIASES: Record<'date' | 'merchant' | 'amount' | 'external_id', string[]> = {
  date: ['date', 'transaction_date', 'posted_date', 'txn_date', 'datetime'],
  merchant: [
    'merchant',
    'merchant_name',
    'description',
    'details',
    'narrative',
    'payee',
    'counterparty',
  ],
  amount: ['amount', 'amount_rwf', 'amount_frws', 'value', 'rwf'],
  external_id: ['external_id', 'reference', 'ref', 'transaction_id', 'txn_id', 'receipt_no'],
}

function pickByAlias(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    const value = row[alias]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

export function parseStatementCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  })

  const rows: StatementRow[] = []
  let skipped = 0

  for (const raw of parsed.data) {
    const result = rowSchema.safeParse({
      date: pickByAlias(raw, FIELD_ALIASES.date),
      merchant: pickByAlias(raw, FIELD_ALIASES.merchant),
      amount: pickByAlias(raw, FIELD_ALIASES.amount),
      external_id: pickByAlias(raw, FIELD_ALIASES.external_id),
    })

    if (!result.success) {
      skipped += 1
      continue
    }

    const date = parseStatementDate(result.data.date)

    if (!date) {
      skipped += 1
      continue
    }

    const amountMinor = tryParseRwfMinorUnits(result.data.amount)

    if (amountMinor === null) {
      skipped += 1
      continue
    }

    rows.push({
      date: date.toISOString(),
      merchant: result.data.merchant,
      amountMinor,
      ...(result.data.external_id ? { externalId: result.data.external_id } : {}),
    })
  }

  return { rows, skipped }
}

/**
 * Accepts ISO dates, MoMo-style DD/MM/YYYY, and DD-MM-YYYY. Returns null for
 * anything unparseable so the caller can skip the row.
 */
export function parseStatementDate(raw: string): Date | null {
  const trimmed = raw.trim()
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(trimmed)

  if (dmy) {
    const [, day, month, year] = dmy
    const normalizedYear = year.length === 2 ? `20${year}` : year
    const date = new Date(
      `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`,
    )
    return Number.isNaN(date.getTime()) ? null : date
  }

  const iso = new Date(trimmed)
  return Number.isNaN(iso.getTime()) ? null : iso
}

/**
 * RWF amounts arrive in many shapes: "-12,500", "12 500", "RWF 12,500",
 * "12500". Strips everything except digits, minus, and decimal point, then
 * converts to integer minor units (RWF francs — no centimes in practice).
 * Returns null when the amount is not a finite number.
 */
export function tryParseRwfMinorUnits(value: string | number): bigint | null {
  const normalized = String(value).replace(/[^0-9.\-]/g, '')

  if (!normalized || normalized === '-' || normalized === '.') return null

  const amount = Number(normalized)

  if (!Number.isFinite(amount)) return null

  return BigInt(Math.round(amount))
}
