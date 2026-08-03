/** Money is handled as integer minor units end-to-end (never floats). */

export function formatRwf(minor: string | number | bigint): string {
  const amount = typeof minor === 'bigint' ? minor : BigInt(minor)
  const sign = amount < 0n ? '-' : ''
  const absolute = amount < 0n ? -amount : amount

  return `${sign}${absolute.toLocaleString('en-US')} RWF`
}

export function formatSignedRwf(minor: string | number | bigint): string {
  const amount = typeof minor === 'bigint' ? minor : BigInt(minor)

  if (amount === 0n) return '0 RWF'

  return `${amount < 0n ? '−' : '+'}${formatRwf(amount)}`
}

export function compactRwf(minor: string | number | bigint): string {
  const amount = typeof minor === 'bigint' ? minor : BigInt(minor)
  const absolute = amount < 0n ? -amount : amount

  if (absolute >= 1000000n) return `${(Number(absolute) / 1000000).toFixed(1)}M`
  if (absolute >= 1000n) return `${Math.round(Number(absolute) / 1000)}k`
  return absolute.toString()
}

export function formatMonth(month: string): string {
  const [year, monthIndex] = month.split('-')
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const name = names[Number(monthIndex) - 1] ?? month

  return `${name} ${year}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
