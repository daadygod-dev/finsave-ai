import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getGroqConfig, chatCompletion } from '../llm/groq'
import {
  matchInsuranceProducts,
  type RankedRecommendation,
} from '../insurance/matcher'

const recommendationQuerySchema = z.object({
  sector: z.string().min(1).max(80).optional(),
  occupation: z.string().min(1).max(80).optional(),
  business_type: z.string().min(1).max(80).optional(),
  has_motorcycle: z.coerce.boolean().optional(),
  dependents: z.coerce.number().int().min(0).max(20).optional(),
})

export async function registerInsuranceRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/insurance/recommendations',
    { preHandler: app.authenticateConsumer },
    async (request) => {
      const query = recommendationQuerySchema.parse(request.query)

      const recommendations = matchInsuranceProducts({
        sector: query.sector,
        occupation: query.occupation,
        businessType: query.business_type,
        hasMotorcycle: query.has_motorcycle,
        dependents: query.dependents,
      })

      // Optional plain-language enrichment via Groq — products come from the
      // deterministic rules table regardless, so a Groq failure degrades to
      // the template descriptions instead of failing the request.
      const groqConfig = getGroqConfig()

      if (groqConfig) {
        const enriched = await explainRecommendations(groqConfig, recommendations)

        if (enriched) {
          return { recommendations: enriched }
        }
      }

      return { recommendations }
    },
  )
}

async function explainRecommendations(
  groqConfig: ReturnType<typeof getGroqConfig> & object,
  recommendations: RankedRecommendation[],
) {
  const prompt = [
    'You write short, plain-language insurance explanations in simple English for Rwandan MSME owners.',
    'Explain why each recommended product fits the person, and give a believable monthly premium range in RWF.',
    'Respond as JSON: {"explanations":[{"id":"crop","explanation":"...","premium_range":"RWF 8,000 - RWF 25,000/month"}]}',
    'Products to explain:',
    recommendations.map((r) => `- ${r.id} (${r.name}): base range RWF ${r.premiumRangeMinor[0]} - ${r.premiumRangeMinor[1]}`).join('\n'),
  ].join('\n')

  try {
    const raw = await chatCompletion(
      groqConfig,
      [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Write the explanations.' },
      ],
      true,
    )

    const parsed = JSON.parse(raw) as {
      explanations?: Array<{ id: string; explanation: string; premium_range?: string }>
    }

    if (!Array.isArray(parsed.explanations)) return null

    const byId = new Map(parsed.explanations.map((entry) => [entry.id, entry]))

    return recommendations.map((recommendation) => {
      const explanation = byId.get(recommendation.id)

      return {
        ...recommendation,
        ...(explanation?.explanation ? { description: explanation.explanation } : {}),
      }
    })
  } catch {
    return null
  }
}
