import type { FastifyInstance } from 'fastify'

export async function registerSessionRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/session/me',
    { preHandler: app.authenticateConsumer },
    async (request) => ({
      user_id: request.user?.id,
      role: request.user?.role,
    }),
  )
}
