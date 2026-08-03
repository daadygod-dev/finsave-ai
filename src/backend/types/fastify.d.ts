import 'fastify'

export type ConsumerRole = 'individual' | 'msme_owner'

export type AuthenticatedUser = {
  id: string
  role: ConsumerRole
  email?: string
}

export type SupabaseIdentity = {
  id: string
  email: string
  /** Role from Supabase user_metadata, when present. */
  role?: ConsumerRole
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser | null
    identity: SupabaseIdentity | null
  }

  interface FastifyInstance {
    authenticateConsumer: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}
