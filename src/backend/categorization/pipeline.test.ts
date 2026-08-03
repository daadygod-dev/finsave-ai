import { describe, expect, it, vi } from 'vitest'
import type { GroqConfig } from '../llm/groq'
import { categorizeBatchWithFallback, type LlmFn } from './pipeline'

const groqConfig: GroqConfig = {
  apiKey: 'test-key',
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'test-model',
}

describe('categorizeBatchWithFallback', () => {
  it('runs rules-first and never calls the LLM for known merchants', async () => {
    const llm = vi.fn<LlmFn>()

    const results = await categorizeBatchWithFallback(
      [{ merchantName: 'MTN MoMo Merchant Payment', amountMinor: -125000 }],
      { groqConfig, llm },
    )

    expect(results[0].category).toBe('mobile_money')
    expect(llm).not.toHaveBeenCalled()
  })

  it('skips the LLM entirely when Groq is not configured', async () => {
    const llm = vi.fn<LlmFn>()

    const results = await categorizeBatchWithFallback(
      [{ merchantName: 'Kigali Vendor 48391', amountMinor: -50000 }],
      { groqConfig: null, llm },
    )

    expect(results[0].category).toBe('uncategorized')
    expect(llm).not.toHaveBeenCalled()
  })

  it('classifies the unmatched long tail with a batched LLM call', async () => {
    const llm = vi.fn<LlmFn>().mockResolvedValue(
      JSON.stringify({
        classifications: [
          { merchant: 'Kigali Vendor 48391', category: 'food', confidence: 0.8 },
        ],
      }),
    )

    const results = await categorizeBatchWithFallback(
      [{ merchantName: 'Kigali Vendor 48391', amountMinor: -50000 }],
      { groqConfig, llm },
    )

    expect(results[0].category).toBe('food')
    expect(results[0].confidence).toBeCloseTo(0.8)
  })

  it('leaves transactions uncategorized when the LLM response is malformed', async () => {
    const llm = vi.fn<LlmFn>().mockResolvedValue('not json at all')

    const results = await categorizeBatchWithFallback(
      [{ merchantName: 'Kigali Vendor 48391', amountMinor: -50000 }],
      { groqConfig, llm },
    )

    expect(results[0].category).toBe('uncategorized')
  })
})
