import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { authenticateConsumer, authenticateIdentity } from '../auth/consumer'
import { prisma } from '../db/client'
import { getSupabaseAdmin } from '../supabase'

const registerSchema = z.object({
  role: z.enum(['individual', 'msme_owner']).optional(),
})

/**
 * User provisioning after Supabase signup.
 *
 * Supabase Auth manages identity; this endpoint creates the matching
 * application User row in Prisma. It is idempotent — calling it again after
 * the row already exists refreshes email/role instead of failing.
 */
const roleSchema = z.object({
  role: z.enum(['individual', 'msme_owner']),
})

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/auth/register',
    {
      preHandler: authenticateIdentity,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const identity = request.identity!
      const body = registerSchema.parse(request.body ?? {})
      // Source of truth: the role chosen at signup and stored in Supabase
      // user_metadata. The body is only a fallback for older clients.
      const role = identity.role ?? body.role ?? 'msme_owner'

      let user

      try {
        user = await prisma.user.upsert({
          where: { id: identity.id },
          create: {
            id: identity.id,
            email: identity.email,
            role,
          },
          update: {
            email: identity.email,
            role,
          },
          select: { id: true, email: true, role: true },
        })
      } catch (error) {
        // The email is already held by a different user row.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return reply.status(409).send({ error: 'email_already_in_use' })
        }
        throw error
      }

      return reply.status(201).send({ user })
    },
  )

  app.patch(
    '/api/v1/auth/role',
    {
      preHandler: app.authenticateConsumer,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const userId = request.user!.id
      const { role } = roleSchema.parse(request.body)

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, role: true },
      })

      // Keep Supabase user_metadata in sync so the register-upsert on the
      // next login does not revert the flip (src/backend/routes/auth.ts line
      // "const role = identity.role ?? …"). Best-effort: the Prisma update
      // is the authoritative change.
      const supabase = getSupabaseAdmin()
      if (supabase) {
        const { data: current } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }))
        if (current?.user) {
          await supabase.auth.admin
            .updateUserById(userId, {
              user_metadata: { ...(current.user.user_metadata ?? {}), role },
            })
            .catch(() => {})
        }
      }

      return reply.send({ role: updated.role })
    },
  )
}
