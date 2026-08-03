import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { categorizeBatchWithFallback } from '../categorization/pipeline'
import { prisma } from '../db/client'
import { parseStatementCsv } from '../ingestion/csv'

const uploadSchema = z.object({
  source: z.enum(['bank_csv', 'momo_csv']),
  institution: z.string().min(1).max(120),
  csv: z.string().min(1),
})

export async function registerCsvUploadRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/csv/upload',
    {
      preHandler: app.authenticateConsumer,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.id
      const body = uploadSchema.parse(request.body)
      const { rows, skipped } = parseStatementCsv(body.csv)

      if (rows.length === 0) {
        return reply.status(400).send({ error: 'no_valid_transactions' })
      }

      // Rules engine first, LLM fallback only for the unmatched long tail.
      const categorized = await categorizeBatchWithFallback(
        rows.map((row) => ({
          merchantName: row.merchant,
          amountMinor: row.amountMinor,
        })),
      )

      const result = await prisma.$transaction(async (tx) => {
        const account = await tx.account.create({
          data: {
            userId,
            source: body.source,
            institution: body.institution,
          },
          select: { id: true },
        })

        await tx.transaction.createMany({
          data: rows.map((row, index) => ({
            accountId: account.id,
            externalId: row.externalId ?? null,
            merchantName: row.merchant,
            amountMinor: row.amountMinor,
            category: categorized[index].category,
            occurredAt: new Date(row.date),
            rawDescription: row.merchant,
          })),
          skipDuplicates: true,
        })

        return { accountId: account.id, imported: rows.length }
      })

      return reply.status(201).send({ ...result, skipped })
    },
  )
}
