import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client'
import {
  createLinkToken,
  createSandboxTransaction,
  exchangePublicToken,
  getPlaidConfig,
} from '../plaid/client'
import { syncLinkedAccount } from '../plaid/sync'
import { decryptSecret, encryptSecret, getTokenEncryptionKey } from '../plaid/tokenCipher'
import { enqueueBackgroundTask } from '../ingestion/background'

const exchangeSchema = z.object({
  public_token: z.string().min(1),
  institution: z.string().min(1).max(120),
})

const syncSchema = z.object({
  account_id: z.string().uuid(),
})

const injectSchema = z.object({
  account_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  amount: z.number(),
  date: z.string().min(1),
})

export async function registerPlaidRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/plaid/create-link-token',
    {
      preHandler: app.authenticateConsumer,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const config = getPlaidConfig()

      if (!config) {
        throw Object.assign(new Error('plaid_not_configured'), { statusCode: 503 })
      }

      const { link_token, expiration } = await createLinkToken(config, request.user!.id)

      return { link_token, expiration }
    },
  )

  app.post(
    '/api/v1/plaid/exchange-token',
    {
      preHandler: app.authenticateConsumer,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const userId = request.user!.id
      const body = exchangeSchema.parse(request.body)
      const config = getPlaidConfig()
      const key = getTokenEncryptionKey()

      if (!config || !key) {
        throw Object.assign(new Error('plaid_not_configured'), { statusCode: 503 })
      }

      const exchanged = await exchangePublicToken(config, body.public_token)
      const ciphertext = encryptSecret(exchanged.access_token, key)

      // A new account row per linked institution — never overwrite an
      // existing linked account (AGENTS.md §3 multi-account rule).
      const account = await prisma.account.create({
        data: {
          userId,
          source: 'plaid_bank',
          institution: body.institution,
          plaidItemId: exchanged.item_id,
          accessTokenCiphertext: ciphertext,
        },
        select: {
          id: true,
          source: true,
          institution: true,
          lastSyncedAt: true,
          createdAt: true,
        },
      })

      return reply.status(201).send({ account })
    },
  )

  app.post(
    '/api/v1/plaid/sync-transactions',
    {
      preHandler: app.authenticateConsumer,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        response: {
          202: {
            type: 'object',
            additionalProperties: false,
            required: ['accepted', 'jobId', 'accountId'],
            properties: {
              accepted: { type: 'boolean' },
              jobId: { type: 'string', format: 'uuid' },
              accountId: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.id
      const body = syncSchema.parse(request.body)

      // Ownership check: the account must belong to the session user.
      const account = await prisma.account.findFirst({
        where: { id: body.account_id, userId },
        select: { id: true },
      })

      if (!account) {
        throw Object.assign(new Error('account_not_found'), { statusCode: 404 })
      }

      const jobId = enqueueBackgroundTask(`plaid-sync:${account.id}`, async () => {
        await syncLinkedAccount(account.id)
      })

      return reply.status(202).send({ accepted: true, jobId, accountId: account.id })
    },
  )
}

/**
 * Live demo injection (build plan §12.1) — the highest-impact demo trick.
 *
 * AGENTS.md §5: this must be hard-disabled outside sandbox builds. It is
 * only ever invoked from app.ts when `PLAID_ENV === 'sandbox'` exactly, so
 * the route does not exist at all in any other build. Never wire this into
 * a production deployment.
 */
export async function registerSandboxOnlyRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/plaid/sandbox/inject-transaction',
    {
      preHandler: app.authenticateConsumer,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request) => {
      const userId = request.user!.id
      const body = injectSchema.parse(request.body)

      const account = await prisma.account.findFirst({
        where: { id: body.account_id, userId, source: 'plaid_bank' },
        select: { id: true, accessTokenCiphertext: true },
      })

      if (!account?.accessTokenCiphertext) {
        throw Object.assign(new Error('account_not_found'), { statusCode: 404 })
      }

      const config = getPlaidConfig()
      const key = getTokenEncryptionKey()

      if (!config || !key) {
        throw Object.assign(new Error('plaid_not_configured'), { statusCode: 503 })
      }

      const accessToken = decryptSecret(account.accessTokenCiphertext, key)

      await createSandboxTransaction(config, accessToken, {
        date: body.date,
        name: body.name,
        amount: body.amount,
      })

      const sync = await syncLinkedAccount(account.id)

      return { injected: true, ...sync }
    },
  )
}
