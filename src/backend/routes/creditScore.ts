import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireRoles } from '../auth/consumer'
import { computeCreditScore } from '../credit/scoring'
import { prisma } from '../db/client'

const computeSchema = z.object({
  business_age_months: z.coerce.number().int().min(0).max(600).optional(),
  on_time_repayments: z.coerce.number().int().min(0).optional(),
  total_repayments: z.coerce.number().int().min(0).optional(),
})

export async function registerCreditScoreRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/credit-score/compute',
    { preHandler: requireRoles('msme_owner') },
    async (request, reply) => {
      const userId = request.user!.id
      const body = computeSchema.parse(request.body)

      // Credit scoring reads across ALL of the business's linked accounts
      // (bank + MoMo, or several of either) — AGENTS.md §3.
      const transactions = await prisma.transaction.findMany({
        where: { account: { userId } },
        select: {
          accountId: true,
          amountMinor: true,
          occurredAt: true,
        },
      })

      const oldestTransaction = transactions.reduce<Date | null>(
        (oldest, transaction) =>
          !oldest || transaction.occurredAt < oldest ? transaction.occurredAt : oldest,
        null,
      )

      const businessAgeMonths =
        body.business_age_months ??
        (oldestTransaction
          ? Math.max(
              1,
              Math.round(
                (Date.now() - oldestTransaction.getTime()) / (1000 * 60 * 60 * 24 * 30),
              ),
            )
          : 6)

      const onTimeRepayments = body.on_time_repayments ?? 0
      const totalRepayments = body.total_repayments ?? 0

      const result = computeCreditScore({
        transactions: transactions.map((transaction) => ({
          accountId: transaction.accountId,
          amountMinor: transaction.amountMinor,
          occurredAt: transaction.occurredAt,
        })),
        businessAgeMonths,
        onTimeRepayments,
        totalRepayments,
      })

      // Append a row per computation so score history is preserved; the GET
      // endpoint returns the latest.
      await prisma.creditScore.create({
        data: {
          businessId: userId,
          score: result.score,
          factorsJson: result.factors,
        },
      })

      return reply.status(201).send({
        score: result.score,
        factors: result.factors,
        computedAt: new Date(),
        businessAgeMonths,
        repayment: { onTimeRepayments, totalRepayments },
      })
    },
  )

  app.get(
    '/api/v1/credit-score',
    { preHandler: requireRoles('msme_owner') },
    async (request) => {
      const userId = request.user!.id

      const latest = await prisma.creditScore.findFirst({
        where: { businessId: userId },
        orderBy: { computedAt: 'desc' },
        select: { score: true, factorsJson: true, computedAt: true },
      })

      if (!latest) {
        throw Object.assign(new Error('credit_score_not_found'), { statusCode: 404 })
      }

      return {
        score: latest.score,
        factors: latest.factorsJson,
        computedAt: latest.computedAt,
      }
    },
  )

  app.get(
    '/api/v1/credit-score/history',
    { preHandler: requireRoles('msme_owner') },
    async (request) => {
      const userId = request.user!.id

      // Every compute writes a row, so past scores are preserved — return
      // the most recent ones for the score-history chart.
      const history = await prisma.creditScore.findMany({
        where: { businessId: userId },
        orderBy: { computedAt: 'desc' },
        take: 12,
        select: { score: true, computedAt: true },
      })

      return { history }
    },
  )
}
