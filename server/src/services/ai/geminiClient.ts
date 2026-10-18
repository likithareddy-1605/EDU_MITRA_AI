import { env, isAiConfigured } from '../../utils/env'

interface GeminiPart {
  text?: string
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] }
}
interface GeminiResponse {
  candidates?: GeminiCandidate[]
}

/**
 * Calls the Gemini REST API directly (no SDK dependency). Throws if no key is
 * configured, on HTTP error, on timeout (20s), or on an empty response.
 */
export async function generateText(prompt: string): Promise<string> {
  if (!isAiConfigured) throw new Error('Gemini API key not configured')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.geminiApiKey}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Gemini request failed (${res.status})`)
    const data = (await res.json()) as GeminiResponse
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty Gemini response')
    return text.trim()
  } finally {
    clearTimeout(timeout)
  }
}

export { isAiConfigured }
