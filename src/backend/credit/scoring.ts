import { Decimal } from 'decimal.js'

export type ScoreTransaction = {
  accountId: string
  amountMinor: bigint | number
  occurredAt: Date
}

export type ScoreInput = {
  transactions: ScoreTransaction[]
  businessAgeMonths: number
  onTimeRepayments: number
  totalRepayments: number
}

export type CreditScoreResult = {
  score: number
  factors: {
    cashFlowConsistency: number
    transactionVolume: number
    repaymentHistory: number
    businessStability: number
    savingsBehavior: number
  }
}

export function computeCreditScore(input: ScoreInput): CreditScoreResult {
  const monthlyNet = new Map<string, Decimal>()
  let positiveMonths = 0
  let inflowCount = 0
  let savedMinor = new Decimal(0)

  for (const transaction of input.transactions) {
    const monthKey = transaction.occurredAt.toISOString().slice(0, 7)
    const amount = new Decimal(transaction.amountMinor.toString())
    monthlyNet.set(monthKey, (monthlyNet.get(monthKey) ?? new Decimal(0)).plus(amount))

    if (amount.isPositive()) {
      inflowCount += 1
    }

    savedMinor = savedMinor.plus(amount)
  }

  for (const net of monthlyNet.values()) {
    if (net.isPositive()) positiveMonths += 1
  }

  const months = Math.max(monthlyNet.size, 1)
  const cashFlowConsistency = Math.round((positiveMonths / months) * 100)
  const transactionVolume = clamp(input.transactions.length * 5, 0, 100)
  const repaymentHistory =
    input.totalRepayments === 0
      ? 50
      : Math.round((input.onTimeRepayments / input.totalRepayments) * 100)
  const businessStability = clamp(Math.round((input.businessAgeMonths / 24) * 100), 0, 100)
  const savingsBehavior = clamp(savedMinor.isPositive() ? 80 + Math.min(inflowCount, 20) : 20, 0, 100)

  const score = Math.round(
    cashFlowConsistency * 0.3 +
      transactionVolume * 0.2 +
      repaymentHistory * 0.25 +
      businessStability * 0.15 +
      savingsBehavior * 0.1,
  )

  return {
    score: clamp(score, 0, 100),
    factors: {
      cashFlowConsistency,
      transactionVolume,
      repaymentHistory,
      businessStability,
      savingsBehavior,
    },
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
