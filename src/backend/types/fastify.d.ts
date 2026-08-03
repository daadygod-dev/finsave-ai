import 'fastify'

export type ConsumerRole = 'individual' | 'msme_owner'

export type AuthenticatedUser = {
  id: string
  role: ConsumerRole
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser | null
  }

  interface FastifyInstance {
    authenticateConsumer: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}
