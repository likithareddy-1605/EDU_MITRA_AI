import { generateText, isAiConfigured } from './ai/geminiClient'

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

function normalizeContext(raw: Partial<AdvisorContext>): AdvisorContext {
  return {
    profile: {
      displayName: raw.profile?.displayName || 'Student',
      branch: raw.profile?.branch || 'Engineering',
      year: raw.profile?.year || 'Current Year',
    },
    cgpa: typeof raw.cgpa === 'number' ? raw.cgpa : 0,
    semesterGpas: Array.isArray(raw.semesterGpas) ? raw.semesterGpas : [],
    subjectAverages: Array.isArray(raw.subjectAverages) ? raw.subjectAverages : [],
    weakSubjects: Array.isArray(raw.weakSubjects) ? raw.weakSubjects : [],
    strongSubjects: Array.isArray(raw.strongSubjects) ? raw.strongSubjects : [],
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    upcoming: Array.isArray(raw.upcoming) ? raw.upcoming : [],
    streak: typeof raw.streak === 'number' ? raw.streak : 0,
  }
}

function trendWord(ctx: AdvisorContext): string {
  const sems = ctx.semesterGpas
  if (sems.length < 2) return 'stable so far'
  const diff = sems[sems.length - 1].sgpa - sems[0].sgpa
  if (diff > 0.2) return 'improving'
  if (diff < -0.2) return 'declining'
  return 'stable'
}

function fallbackSummary(rawCtx: AdvisorContext): string {
  const ctx = normalizeContext(rawCtx)
  const weak = ctx.weakSubjects.length ? ctx.weakSubjects.join(', ') : 'no specific weak areas'
  const near = ctx.upcoming[0]
  return [
    `${ctx.profile.displayName} is in ${ctx.profile.year} of ${ctx.profile.branch}. CGPA is ${ctx.cgpa.toFixed(2)} and the trend is ${trendWord(ctx)}.`,
    `Strongest subjects: ${ctx.strongSubjects.join(', ') || '—'}. Improvement areas: ${weak}.`,
    near ? `Nearest deadline: "${near.title}" on ${near.due}.` : 'No upcoming deadlines recorded.',
    ctx.streak > 0 ? `Current learning streak: ${ctx.streak} day(s).` : '',
    'Suggested focus: spend more weekly time on improvement areas and prepare early for the nearest deadline.',
  ]
    .filter(Boolean)
    .join(' ')
}

function fallbackAnswer(rawCtx: AdvisorContext, isAiSetup = false): string {
  const ctx = normalizeContext(rawCtx)
  const prefix = isAiSetup
    ? '(AI response unavailable — showing rule-based guidance.)'
    : '(Demo mode — AI not configured.)'
  return `${prefix} Based on your records, your improvement areas are ${
    ctx.weakSubjects.join(', ') || 'not yet identified'
  }. A reliable approach: revise core concepts in those subjects, solve practice problems daily, and ask your faculty specific doubts. Add more subject marks and goals for more tailored guidance.`
}

function buildSummaryPrompt(ctx: AdvisorContext): string {
  return [
    'You are an academic advisor for an engineering student in India.',
    'Write a short (max 150 words), plain-language progress summary for the student.',
    'Do not invent marks, ranks, or statistics. Be specific to the data given.',
    `Student: ${ctx.profile.displayName}, ${ctx.profile.year}, ${ctx.profile.branch}.`,
    `CGPA: ${ctx.cgpa.toFixed(2)}. Semester SGPA: ${ctx.semesterGpas.map((s) => `Sem ${s.semester}=${s.sgpa}`).join(', ') || 'n/a'}.`,
    `Subject averages: ${ctx.subjectAverages.map((s) => `${s.subject}=${s.averageMarks}`).join(', ') || 'n/a'}.`,
    `Weak subjects: ${ctx.weakSubjects.join(', ') || 'none'}. Strong subjects: ${ctx.strongSubjects.join(', ') || 'none'}.`,
    `Active goals: ${ctx.goals.map((g) => g.title).join('; ') || 'none'}.`,
    `Upcoming: ${ctx.upcoming.map((u) => `${u.title} (${u.due})`).join('; ') || 'none'}.`,
    `Streak: ${ctx.streak} day(s).`,
  ].join('\n')
}

function buildAnswerPrompt(ctx: AdvisorContext, question: string): string {
  return [
    'You are an academic study assistant for an engineering student.',
    'Answer the student question clearly and briefly (max 150 words). Use the context.',
    'Do not invent marks or guarantees. If the question is unrelated to study, gently refocus.',
    `Context — CGPA: ${ctx.cgpa.toFixed(2)}. Weak subjects: ${ctx.weakSubjects.join(', ') || 'none'}.`,
    `Strong subjects: ${ctx.strongSubjects.join(', ') || 'none'}.`,
    `Upcoming: ${ctx.upcoming.map((u) => `${u.title} (${u.due})`).join('; ') || 'none'}.`,
    `Question: ${question}`,
  ].join('\n')
}

export async function summarizeProgress(rawCtx: AdvisorContext): Promise<AdvisorResult> {
  const ctx = normalizeContext(rawCtx)
  if (!isAiConfigured) return { source: 'fallback', text: fallbackSummary(ctx) }
  try {
    return { source: 'ai', text: await generateText(buildSummaryPrompt(ctx)) }
  } catch (err) {
    console.warn('[academicAdvisor] AI summary failed, using fallback:', err)
    return { source: 'fallback', text: fallbackSummary(ctx) }
  }
}

export async function answerQuestion(rawCtx: AdvisorContext, question: string): Promise<AdvisorResult> {
  const ctx = normalizeContext(rawCtx)
  if (!isAiConfigured) return { source: 'fallback', text: fallbackAnswer(ctx, false) }
  try {
    return { source: 'ai', text: await generateText(buildAnswerPrompt(ctx, question)) }
  } catch (err) {
    console.warn('[academicAdvisor] AI answer failed, using fallback:', err)
    return { source: 'fallback', text: fallbackAnswer(ctx, true) }
  }
}
