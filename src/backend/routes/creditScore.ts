import type { FastifyInstance } from 'fastify'
import { requireRoles } from '../auth/consumer'
import { computeCreditScore } from '../credit/scoring'
import { prisma } from '../db/client'
import { withTimeout } from '../util'

/**
 * Hard cap on the scoring data-gathering phase. A hung or overloaded
 * database should fail with a clear 504 rather than leave the request
 * hanging until a proxy/Cloud Run timeout kills it.
 */
const SCORING_QUERY_TIMEOUT_MS = 15_000

export async function registerCreditScoreRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/credit-score/compute',
    { preHandler: requireRoles('msme_owner') },
    async (request, reply) => {
      const userId = request.user!.id

      // Credit scoring reads across ALL of the business's linked accounts
      // (bank + MoMo, or several of either) — AGENTS.md §3. The accounts and
      // their transactions are gathered in parallel so the two queries never
      // serialize on the database.
      const [accounts, transactions] = await withTimeout(
        Promise.all([
          prisma.account.findMany({
            where: { userId },
            select: { id: true },
          }),
          prisma.transaction.findMany({
            where: { account: { userId } },
            select: {
              accountId: true,
              amountMinor: true,
              occurredAt: true,
            },
          }),
        ]),
        SCORING_QUERY_TIMEOUT_MS,
      )

      // A score computed from zero linked accounts would be meaningless —
      // fail with an explicit, actionable error instead of a fake number.
      if (accounts.length === 0) {
        throw Object.assign(new Error('no_linked_accounts'), { statusCode: 400 })
      }

      const result = computeCreditScore({
        transactions: transactions.map((transaction) => ({
          accountId: transaction.accountId,
          amountMinor: transaction.amountMinor,
          occurredAt: transaction.occurredAt,
        })),
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
