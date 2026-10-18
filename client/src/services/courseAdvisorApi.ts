// Frontend service for the Course Advisor AI explanation. All AI calls go
// through the Express backend (keys stay server-side). When AI is not
// configured, the backend returns a clearly-labelled rule-based fallback.

export interface ExplainPayload {
  assessment: {
    favouriteSubjects: string[]
    interests: string[]
    strengths: string[]
    careerGoals: string[]
    preferredBranches: string[]
    mathPerformance: string
    physicsPerformance: string
    chemistryPerformance: string
  }
  topBranches: Array<{ name: string; score: number; reasons: string[] }>
}

export interface ExplainResult {
  source: 'ai' | 'fallback'
  summary: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

export async function explainRecommendations(payload: ExplainPayload): Promise<ExplainResult> {
  const res = await fetch(`${API_BASE}/course-advisor/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to fetch AI explanation')
  return (await res.json()) as ExplainResult
}
