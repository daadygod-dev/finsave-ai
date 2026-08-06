import type { FastifyInstance } from 'fastify'
import { prisma } from '../db/client'

type AlertTone = 'warning' | 'info'

type Alert = {
  id: string
  tone: AlertTone
  title: string
  body: string
}

/**
 * Returns explainable, derived alerts from the caller's own accounts. Alerts
 * are deliberately computed from the latest financial state rather than
 * exposing a cross-user cache or trusting a client-supplied user id.
 */
export async function registerAlertRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/alerts',
    {
      preHandler: app.authenticateConsumer,
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (request) => {
      const userId = request.user!.id
      const [transactions, accountCount] = await Promise.all([
        prisma.transaction.findMany({
          where: { account: { userId } },
          select: { amountMinor: true, category: true },
        }),
        prisma.account.count({ where: { userId } }),
      ])

      let income = 0n
      let spending = 0n
      const categoryTotals = new Map<string, bigint>()

      for (const transaction of transactions) {
        if (transaction.amountMinor >= 0n) {
          income += transaction.amountMinor
          continue
        }
        const amount = -transaction.amountMinor
        spending += amount
        categoryTotals.set(transaction.category, (categoryTotals.get(transaction.category) ?? 0n) + amount)
      }

      const alerts: Alert[] = []
      const highestCategory = [...categoryTotals.entries()].sort((a, b) => (a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0))[0]

      if (highestCategory && spending > 0n) {
        const share = Number((highestCategory[1] * 100n) / spending)
        alerts.push({
          id: 'top-spending-category',
          tone: 'info',
          title: 'Top expense category',
          body: `${formatCategory(highestCategory[0])} represents ${share}% of your recorded spending.`,
        })
      }

      if (income > 0n && spending * 10n > income * 8n) {
        const ratio = Number((spending * 100n) / income)
        alerts.push({
          id: 'high-spending-ratio',
          tone: 'warning',
          title: 'Spending is elevated',
          body: `Recorded spending is ${ratio}% of income in the current data set.`,
        })
      }

      if (accountCount > 1) {
        alerts.push({
          id: 'multi-account-summary',
          tone: 'info',
          title: 'Multiple accounts included',
          body: `${accountCount} linked accounts are included in your financial summary.`,
        })
      }

      return { alerts }
    },
  )
}

function formatCategory(category: string) {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
