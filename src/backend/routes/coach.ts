import type { FastifyInstance } from 'fastify'
import { generateCoachInsights } from '../coach'

/**
 * AI financial coach insights. Rate-limited because the Groq path consumes
 * the free-tier LLM quota (AGENTS.md §9).
 */
export async function registerCoachRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/coach/insights',
    {
      preHandler: app.authenticateConsumer,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request) => {
      const insights = await generateCoachInsights(request.user!.id)

      return { insights, generatedAt: new Date() }
    },
  )
}
