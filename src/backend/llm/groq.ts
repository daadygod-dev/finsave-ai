/**
 * Minimal Groq client for the LLM fallback paths (categorization long tail
 * and insurance explanations). Groq exposes an OpenAI-compatible endpoint,
 * so this is a thin fetch wrapper.
 *
 * Rules from AGENTS.md that apply here:
 * - The API key is never logged, echoed in an error, or exposed to a client.
 * - This endpoint consumes the free-tier LLM quota — callers must run the
 *   deterministic rules engine first and only use this for the long tail.
 */
export type GroqConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

export function getGroqConfig(env: NodeJS.ProcessEnv = process.env): GroqConfig | null {
  const apiKey = env.GROQ_API_KEY

  if (!apiKey) return null

  return {
    apiKey,
    baseUrl: env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
    model: env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
  }
}

export type ChatMessage = { role: 'system' | 'user'; content: string }

export async function chatCompletion(
  config: GroqConfig,
  messages: ChatMessage[],
  jsonMode = false,
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!response.ok) {
    // Opaque error on purpose — never surface response bodies to callers.
    throw new Error(`groq_request_failed:${response.status}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return data.choices?.[0]?.message?.content ?? ''
}
