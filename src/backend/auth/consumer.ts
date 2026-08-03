import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ConsumerRole } from '../types/fastify'
import { prisma } from '../db/client'
import { getSupabaseAdmin } from '../supabase'

function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization
  if (!header) return null

  const [scheme, token, ...rest] = header.trim().split(/\s+/)

  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) return null

  return token
}

const CONSUMER_ROLES: ConsumerRole[] = ['individual', 'msme_owner']

function roleFromMetadata(value: unknown): ConsumerRole | undefined {
  if (
    typeof value === 'string' &&
    (CONSUMER_ROLES as string[]).includes(value)
  ) {
    return value as ConsumerRole
  }
  return undefined
}

async function verifySupabaseToken(token: string) {
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    throw Object.assign(new Error('supabase_not_configured'), { statusCode: 503 })
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw Object.assign(new Error('unauthorized'), { statusCode: 401 })
  }

  return data.user
}

/**
 * Identity-only gate: verifies the Supabase JWT but does not require an
 * application User row yet — used by the registration endpoint that
 * provisions the Prisma User after signup. The role is read from the
 * user_metadata set at signup (never from a client-supplied value).
 */
export async function authenticateIdentity(request: FastifyRequest, reply: FastifyReply) {
  const token = getBearerToken(request)

  if (!token) {
    return reply.status(401).send({ error: 'unauthorized' })
  }

  const user = await verifySupabaseToken(token)

  request.identity = {
    id: user.id,
    email: user.email ?? '',
    role: roleFromMetadata(user.user_metadata?.role),
  }
}

/**
 * Consumer authentication: verifies the Supabase JWT, then loads the
 * application User row from Prisma. No dev headers, no fallbacks — a real
 * Supabase session is the only way in.
 */
export async function authenticateConsumer(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = getBearerToken(request)

  if (!token) {
    return reply.status(401).send({ error: 'unauthorized' })
  }

  const supabaseUser = await verifySupabaseToken(token)
  const user = await prisma.user.findUnique({ where: { id: supabaseUser.id } })

  if (!user) {
    return reply.status(401).send({ error: 'user_not_registered' })
  }

  request.user = {
    id: user.id,
    role: user.role as ConsumerRole,
    email: user.email,
  }
}

/**
 * Deny-by-default role gate (AGENTS.md §6): authenticates the consumer
 * session, then rejects any role not explicitly listed. Used on endpoints
 * that are restricted to a subset of consumer roles (e.g. msme_owner only).
 */
export function requireRoles(...roles: ConsumerRole[]) {
  return async function enforceRole(request: FastifyRequest, reply: FastifyReply) {
    await authenticateConsumer(request, reply)

    if (reply.sent) return

    if (!request.user || !roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'forbidden' })
    }
  }
}
