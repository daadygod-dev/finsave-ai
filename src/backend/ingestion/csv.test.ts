import { describe, expect, it } from 'vitest'
import { parseStatementCsv, parseStatementDate, tryParseRwfMinorUnits } from './csv'

describe('parseStatementCsv', () => {
  it('parses a well-formed MoMo-style statement', () => {
    const csv = [
      'Date,Merchant,Amount',
      '01/08/2026,MTN MoMo Merchant Payment,-12500',
      '02/08/2026,Yego Moto,-2000',
      '03/08/2026,Client invoice deposit,680000',
    ].join('\n')

    const result = parseStatementCsv(csv)

    expect(result.skipped).toBe(0)
    expect(result.rows).toHaveLength(3)
    expect(result.rows[0].amountMinor).toBe(-12500n)
    expect(result.rows[1].amountMinor).toBe(-2000n)
    expect(result.rows[2].amountMinor).toBe(680000n)
  })

  it('skips malformed rows instead of crashing the parser', () => {
    const csv = [
      'Date,Merchant,Amount,Note',
      'not-a-date,Nyamabuye market,-5,000',
      '04/08/2026,,10,000', // missing merchant
      '05/08/2026,Wasac water,-3,500',
      '06/08/2026,Unknown shop,abc', // unparseable amount
    ].join('\n')

    const result = parseStatementCsv(csv)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].merchant).toBe('Wasac water')
    expect(result.skipped).toBe(3)
  })

  it('tolerates header casing, extra columns, quoted RWF amounts, and odd spacing', () => {
    const csv = [
      'transaction_date,description,amount_rwf,reference',
      '2026-07-10,Rent landlord,"RWF 260,000",REF1',
      '2026-07-12,REG electricity, 9 800 ,REF2',
    ].join('\n')

    const result = parseStatementCsv(csv)

    expect(result.skipped).toBe(0)
    expect(result.rows[0].amountMinor).toBe(260000n)
    expect(result.rows[1].amountMinor).toBe(9800n)
  })
})

describe('parseStatementDate', () => {
  it('accepts ISO and DD/MM/YYYY formats', () => {
    expect(parseStatementDate('2026-08-03')?.toISOString().slice(0, 10)).toBe('2026-08-03')
    expect(parseStatementDate('03/08/2026')?.toISOString().slice(0, 10)).toBe('2026-08-03')
    expect(parseStatementDate('03-08-26')?.toISOString().slice(0, 10)).toBe('2026-08-03')
  })

  it('rejects unparseable dates', () => {
    expect(parseStatementDate('not-a-date')).toBeNull()
  })
})

describe('tryParseRwfMinorUnits', () => {
  it('handles common RWF amount formatting', () => {
    expect(tryParseRwfMinorUnits('-12,500')).toBe(-12500n)
    expect(tryParseRwfMinorUnits('12 500')).toBe(12500n)
    expect(tryParseRwfMinorUnits('RWF 12,500')).toBe(12500n)
    expect(tryParseRwfMinorUnits(680000)).toBe(680000n)
  })

  it('returns null for unparseable amounts', () => {
    expect(tryParseRwfMinorUnits('abc')).toBeNull()
    expect(tryParseRwfMinorUnits('--5')).toBeNull()
  })
})
