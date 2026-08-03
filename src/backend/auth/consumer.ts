import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const devSessionSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['individual', 'msme_owner']),
})

export async function authenticateConsumer(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const devHeader = request.headers['x-dev-user']

  if (process.env.NODE_ENV !== 'production' && typeof devHeader === 'string') {
    request.user = devSessionSchema.parse(JSON.parse(devHeader))
    return
  }

  return reply.status(401).send({ error: 'unauthorized' })
}
