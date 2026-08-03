/**
 * Average monthly surplus estimator used by the feasibility check:
 * (avg monthly income) - (avg monthly essential spending), computed from
 * the authenticated user's recent transactions.
 *
 * Essential categories are the ones a savings plan can't easily flex:
 * food, utilities, rent, transport.
 */
import { prisma } from '../db/client'

const ESSENTIAL_CATEGORIES = new Set(['food', 'utilities', 'rent', 'transport'])

export async function estimateMonthlySurplus(userId: string, months = 3) {
  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const transactions = await prisma.transaction.findMany({
    where: {
      account: { userId },
      occurredAt: { gte: since },
    },
    select: { amountMinor: true, category: true },
  })

  let incomeMinor = 0n
  let essentialSpendingMinor = 0n

  for (const transaction of transactions) {
    if (transaction.amountMinor > 0n) {
      incomeMinor += transaction.amountMinor
    } else if (ESSENTIAL_CATEGORIES.has(transaction.category)) {
      essentialSpendingMinor += -transaction.amountMinor
    }
  }

  const divisor = BigInt(Math.max(months, 1))

  return {
    avgMonthlyIncomeMinor: (incomeMinor / divisor).toString(),
    avgMonthlyEssentialSpendingMinor: (essentialSpendingMinor / divisor).toString(),
  }
}
