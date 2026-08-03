import type { FastifyInstance } from 'fastify'
import Papa from 'papaparse'
import { z } from 'zod'
import { categorizeTransaction } from '../categorization/rules'
import { prisma } from '../db/client'

const uploadSchema = z.object({
  source: z.enum(['bank_csv', 'momo_csv']),
  institution: z.string().min(1).max(120),
  csv: z.string().min(1),
})

const rowSchema = z.object({
  date: z.string().min(1),
  merchant: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  external_id: z.string().optional(),
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
      const parsed = Papa.parse<Record<string, unknown>>(body.csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
      })

      const rows = parsed.data
        .map((row) => rowSchema.safeParse(row))
        .filter((row) => row.success)
        .map((row) => row.data)

      if (rows.length === 0) {
        return reply.status(400).send({ error: 'no_valid_transactions' })
      }

      const result = await prisma.$transaction(async (tx) => {
        const account = await tx.account.create({
          data: {
            userId,
            source: body.source,
            institution: body.institution,
          },
          select: { id: true },
        })

        let imported = 0

        for (const row of rows) {
          const amountMinor = parseRwfMinorUnits(row.amount)
          const categorized = categorizeTransaction({
            merchantName: row.merchant,
            amountMinor,
          })

          await tx.transaction.create({
            data: {
              accountId: account.id,
              externalId: row.external_id || null,
              merchantName: row.merchant,
              amountMinor,
              category: categorized.category,
              occurredAt: new Date(row.date),
              rawDescription: row.merchant,
            },
          })

          imported += 1
        }

        return { accountId: account.id, imported }
      })

      return reply.status(201).send(result)
    },
  )
}

function parseRwfMinorUnits(value: string | number) {
  const normalized = String(value).replace(/[,\s]/g, '')
  const amount = Number(normalized)

  if (!Number.isFinite(amount)) {
    throw Object.assign(new Error('invalid_amount'), { statusCode: 400 })
  }

  return BigInt(Math.round(amount))
}
