// Frontend client for the AI Academic Advisor. AI runs server-side (keys never
// reach the browser); the backend returns a clearly-labelled rule-based
// fallback when GEMINI_API_KEY is not set.

export interface AdvisorContext {
  profile: { displayName: string; branch: string; year: string }
  cgpa: number
  semesterGpas: { semester: number; sgpa: number }[]
  subjectAverages: { subject: string; averageMarks: number; trend: string }[]
  weakSubjects: string[]
  strongSubjects: string[]
  goals: { title: string; progress: number; deadline?: string }[]
  upcoming: { title: string; due: string }[]
  streak: number
}

export interface AdvisorResult {
  source: 'ai' | 'fallback'
  text: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

export async function getAdvisorSummary(ctx: AdvisorContext): Promise<AdvisorResult> {
  const res = await fetch(`${API_BASE}/academic-advisor/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ctx),
  })
  if (!res.ok) throw new Error('Failed to fetch summary')
  return (await res.json()) as AdvisorResult
}

export async function askAdvisor(ctx: AdvisorContext, question: string): Promise<AdvisorResult> {
  const res = await fetch(`${API_BASE}/academic-advisor/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: ctx, question }),
  })
  if (!res.ok) throw new Error('Failed to fetch answer')
  return (await res.json()) as AdvisorResult
}
