import type { FastifyInstance } from 'fastify'
import { prisma } from '../db/client'

export async function registerAccountRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/accounts',
    { preHandler: app.authenticateConsumer },
    async (request) => {
      const userId = request.user!.id

      const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          source: true,
          institution: true,
          lastSyncedAt: true,
          createdAt: true,
        },
      })

      return { accounts }
    },
  )
}
