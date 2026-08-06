import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { categorizeBatchWithFallback } from '../categorization/pipeline'
import { prisma } from '../db/client'
import { parseStatementCsv } from '../ingestion/csv'
import { enqueueBackgroundTask } from '../ingestion/background'

const INSERT_CHUNK_SIZE = 500

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
      schema: {
        response: {
          202: {
            type: 'object',
            additionalProperties: false,
            required: ['accepted', 'jobId'],
            properties: {
              accepted: { type: 'boolean' },
              jobId: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.id
      const body = uploadSchema.parse(request.body)
      const jobId = enqueueBackgroundTask(`csv-upload:${userId}`, async () => {
        const { rows } = parseStatementCsv(body.csv)

        if (rows.length === 0) {
          throw new Error('no_valid_transactions')
        }

        // Rules engine first, LLM fallback only for the unmatched long tail.
        const categorized = await categorizeBatchWithFallback(
          rows.map((row) => ({
            merchantName: row.merchant,
            amountMinor: row.amountMinor,
          })),
        )

        await prisma.$transaction(async (tx) => {
          const account = await tx.account.create({
            data: {
              userId,
              source: body.source,
              institution: body.institution,
            },
            select: { id: true },
          })

          const entries = rows.map((row, index) => ({
              accountId: account.id,
              externalId: row.externalId ?? null,
              merchantName: row.merchant,
              amountMinor: row.amountMinor,
              category: categorized[index].category,
              occurredAt: new Date(row.date),
              rawDescription: row.merchant,
            }))

          for (const chunk of chunkEntries(entries)) {
            await tx.transaction.createMany({ data: chunk, skipDuplicates: true })
          }
        })
      })

      return reply.status(202).send({ accepted: true, jobId })
    },
  )
}

function chunkEntries<T>(entries: T[]): T[][] {
  const chunks: T[][] = []
  for (let offset = 0; offset < entries.length; offset += INSERT_CHUNK_SIZE) {
    chunks.push(entries.slice(offset, offset + INSERT_CHUNK_SIZE))
  }
  return chunks
}
