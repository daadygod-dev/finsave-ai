import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client'

const transactionQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

const summaryQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
})

export async function registerTransactionRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/transactions',
    { preHandler: app.authenticateConsumer },
    async (request) => {
      const userId = request.user!.id
      const query = transactionQuerySchema.parse(request.query)

      if (query.account_id) {
        await assertAccountOwnership(query.account_id, userId)
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          account: {
            userId,
            ...(query.account_id ? { id: query.account_id } : {}),
          },
        },
        orderBy: { occurredAt: 'desc' },
        take: query.limit,
        select: {
          id: true,
          merchantName: true,
          amountMinor: true,
          currency: true,
          category: true,
          occurredAt: true,
          account: {
            select: {
              id: true,
              source: true,
              institution: true,
            },
          },
        },
      })

      return {
        transactions: transactions.map((transaction) => ({
          ...transaction,
          amountMinor: transaction.amountMinor.toString(),
        })),
      }
    },
  )

  app.get(
    '/api/v1/spending/summary',
    { preHandler: app.authenticateConsumer },
    async (request) => {
      const userId = request.user!.id
      const query = summaryQuerySchema.parse(request.query)

      if (query.account_id) {
        await assertAccountOwnership(query.account_id, userId)
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          account: {
            userId,
            ...(query.account_id ? { id: query.account_id } : {}),
          },
        },
        select: {
          amountMinor: true,
          category: true,
          occurredAt: true,
          account: {
            select: {
              id: true,
              source: true,
              institution: true,
            },
          },
        },
      })

      const byCategory = new Map<string, bigint>()
      const byMonth = new Map<string, bigint>()
      const byAccount = new Map<
        string,
        {
          accountId: string
          institution: string
          source: string
          spendingMinor: bigint
          incomeMinor: bigint
        }
      >()

      for (const transaction of transactions) {
        const amount = transaction.amountMinor
        const absolute = amount < 0n ? -amount : amount
        const month = transaction.occurredAt.toISOString().slice(0, 7)
        const accountKey = transaction.account.id

        if (amount < 0n) {
          byCategory.set(
            transaction.category,
            (byCategory.get(transaction.category) ?? 0n) + absolute,
          )
          byMonth.set(month, (byMonth.get(month) ?? 0n) + absolute)
        }

        const accountSummary = byAccount.get(accountKey) ?? {
          accountId: transaction.account.id,
          institution: transaction.account.institution,
          source: transaction.account.source,
          spendingMinor: 0n,
          incomeMinor: 0n,
        }

        if (amount < 0n) {
          accountSummary.spendingMinor += absolute
        } else {
          accountSummary.incomeMinor += amount
        }

        byAccount.set(accountKey, accountSummary)
      }

      return {
        byCategory: serializeTotals(byCategory, 'category'),
        byMonth: serializeTotals(byMonth, 'month'),
        byAccount: [...byAccount.values()].map((account) => ({
          ...account,
          spendingMinor: account.spendingMinor.toString(),
          incomeMinor: account.incomeMinor.toString(),
        })),
      }
    },
  )
}

async function assertAccountOwnership(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  })

  if (!account) {
    throw Object.assign(new Error('account_not_found'), { statusCode: 404 })
  }
}

function serializeTotals(totals: Map<string, bigint>, keyName: 'category' | 'month') {
  return [...totals.entries()].map(([key, amountMinor]) => ({
    [keyName]: key,
    amountMinor: amountMinor.toString(),
  }))
}
