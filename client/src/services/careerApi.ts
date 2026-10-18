// Frontend client for Career Guidance backend recommendations.
// Follows the same pattern as courseAdvisorApi: calls Express backend,
// where Gemini API key stays server-side, with honest fallback handling.

export interface CareerGuidancePayload {
  studentName: string
  branch: string
  year: string
  careerInterest: string
  currentSkills: string[]
  cgpa: number
  targetRole?: string
}

export interface CareerGuidanceResponse {
  source: 'ai' | 'fallback'
  personalizedAdvice: string
  prioritySkills: string[]
  recommendedActions: string[]
  recommendedResources: { title: string; type: string; url: string; platform: string }[]
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

export async function fetchCareerGuidance(payload: CareerGuidancePayload): Promise<CareerGuidanceResponse> {
  const res = await fetch(`${API_BASE}/career/guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to fetch career guidance')
  return (await res.json()) as CareerGuidanceResponse
}
