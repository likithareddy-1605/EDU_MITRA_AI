import { env, isAiConfigured } from '../../utils/env'

interface GeminiPart {
  text?: string
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] }
}
interface GeminiResponse {
  candidates?: GeminiCandidate[]
  error?: { code: number; message: string; status: string }
}

// Supported and available Gemini models in priority order.
// If one model is temporarily overloaded (503) or unavailable, the client
// automatically falls back to the next model in the list.
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
]

/**
 * Calls the Gemini REST API directly with automatic model fallback.
 * Throws if no key is configured, on network timeout (20s), or if all models fail.
 */
export async function generateText(prompt: string): Promise<string> {
  const apiKey = env.geminiApiKey?.trim()
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  let lastError: Error | null = null

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      })

      if (res.ok) {
        const data = (await res.json()) as GeminiResponse
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.trim().length > 0) {
          return text.trim()
        }
        throw new Error(`Empty text candidates from model ${model}`)
      }

      const errData = (await res.json().catch(() => ({}))) as GeminiResponse
      const errMsg = errData.error?.message || `HTTP ${res.status}`
      console.warn(`[geminiClient] Model ${model} returned error (${res.status}): ${errMsg}. Trying fallback model...`)
      lastError = new Error(`Gemini model ${model} error: ${errMsg}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[geminiClient] Model ${model} call failed (${msg}). Trying fallback model...`)
      lastError = err instanceof Error ? err : new Error(msg)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error('All Gemini models failed')
}

export { isAiConfigured }

