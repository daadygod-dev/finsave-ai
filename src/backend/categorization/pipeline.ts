/**
 * Categorization pipeline: deterministic rules engine first, LLM fallback
 * for the unmatched long tail only (AGENTS.md §6.3 / §9 — the free-tier
 * Groq quota is preserved by keeping the LLM call out of the happy path).
 *
 * The LLM call is batched (one request for all unmatched merchants) and is
 * fully optional: if Groq is not configured, or the call fails, unmatched
 * transactions stay `uncategorized` — categorization is never a hard
 * dependency of ingestion.
 */
import { getGroqConfig, chatCompletion, type GroqConfig } from '../llm/groq'
import {
  categorizeTransaction,
  TRANSACTION_CATEGORIES,
  type CategorizedTransaction,
  type TransactionCategory,
  type TransactionForCategorization,
} from './rules'

export type LlmFn = (
  config: GroqConfig,
  system: string,
  user: string,
  jsonMode: boolean,
) => Promise<string>

export type PipelineDeps = {
  groqConfig: GroqConfig | null
  llm: LlmFn
}

export function defaultDeps(): PipelineDeps {
  return {
    groqConfig: getGroqConfig(),
    llm: (config, system, user, jsonMode) =>
      chatCompletion(config, [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ], jsonMode),
  }
}

const SYSTEM_PROMPT = [
  'You are a transaction categorization engine for a personal finance app in Rwanda.',
  'Categorize each merchant into EXACTLY one of these categories:',
  TRANSACTION_CATEGORIES.map((category) => `- ${category}`).join('\n'),
  'Respond with JSON of the form:',
  '{"classifications":[{"merchant":"<exact merchant name from input>","category":"<one of the categories>","confidence":0.0}]}',
  'Return one entry per input merchant, in the same order. Confidence is a number between 0 and 1.',
].join('\n')

type LlmClassification = {
  merchant: string
  category: string
  confidence: number
}

export async function categorizeBatchWithFallback(
  transactions: TransactionForCategorization[],
  deps: PipelineDeps = defaultDeps(),
): Promise<CategorizedTransaction[]> {
  const results = transactions.map((transaction) => categorizeTransaction(transaction))
  const unmatched = results.filter((result) => result.category === 'uncategorized')

  if (unmatched.length === 0 || !deps.groqConfig) {
    return results
  }

  const classifications = await classifyUnmatched(unmatched, deps)

  if (classifications) {
    const byMerchant = new Map(
      classifications.map((entry) => [entry.merchant.toLowerCase(), entry]),
    )

    for (const result of results) {
      if (result.category !== 'uncategorized') continue

      const classification = byMerchant.get(result.merchantName.toLowerCase())

      if (classification && isCategory(classification.category)) {
        result.category = classification.category
        result.confidence = clampConfidence(classification.confidence)
      }
    }
  }

  return results
}

async function classifyUnmatched(
  unmatched: CategorizedTransaction[],
  deps: PipelineDeps,
): Promise<LlmClassification[] | null> {
  if (!deps.groqConfig) return null

  const merchants = unmatched.map((transaction) => transaction.merchantName)
  const userPrompt = `Classify these merchants:\n${merchants.map((merchant) => `- ${merchant}`).join('\n')}`

  try {
    const raw = await deps.llm(deps.groqConfig, SYSTEM_PROMPT, userPrompt, true)
    const parsed = JSON.parse(raw) as { classifications?: LlmClassification[] }

    if (!Array.isArray(parsed.classifications)) return null

    return parsed.classifications
      .filter((entry) => typeof entry.merchant === 'string' && typeof entry.category === 'string')
      .slice(0, merchants.length)
  } catch {
    // LLM failure must never break ingestion — leave the long tail uncategorized.
    return null
  }
}

function isCategory(value: string): value is TransactionCategory {
  return (TRANSACTION_CATEGORIES as readonly string[]).includes(value)
}

function clampConfidence(confidence: number) {
  if (!Number.isFinite(confidence)) return 0
  return Math.min(Math.max(confidence, 0), 1)
}
