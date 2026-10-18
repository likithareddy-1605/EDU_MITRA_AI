import { generateText, isAiConfigured } from './ai/geminiClient'

export interface ExplainRequest {
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

export interface ExplainResponse {
  source: 'ai' | 'fallback'
  summary: string
}

/** Honest, deterministic narrative used when AI is not configured or fails. */
function fallbackSummary(req: ExplainRequest): string {
  const a = req.assessment
  const top = req.topBranches[0]
  const interests = a.interests.length ? a.interests.join(', ') : 'your interests'
  const subs = a.favouriteSubjects.length ? a.favouriteSubjects.join(', ') : 'your favourite subjects'
  const goals = a.careerGoals.length ? a.careerGoals.join(', ') : 'your career goals'
  let s = `Based on ${subs} and ${interests}, with goals in ${goals}, `
  s += top
    ? `${top.name} is a strong fit (match score ${top.score}/100). ${top.reasons.join('. ')}.`
    : 'several branches could suit you.'
  s +=
    ' Discuss these options with your family, verify admission requirements and fees with each institution, and weigh location and budget before deciding.'
  return s
}

function buildPrompt(req: ExplainRequest): string {
  const a = req.assessment
  const tops = req.topBranches
    .map((b) => `- ${b.name} (${b.score}/100): ${b.reasons.join('; ')}`)
    .join('\n')
  return [
    'You are an education guidance assistant for engineering aspirants in India.',
    'Write a short, plain-language summary (max 180 words) to help a student and their family discuss engineering branch choices.',
    'Do not invent fees, cutoffs, placement numbers, or admission chances.',
    'Be supportive and neutral; do not choose for the family.',
    `Interests: ${a.interests.join(', ') || 'not specified'}.`,
    `Favourite subjects: ${a.favouriteSubjects.join(', ') || 'not specified'}.`,
    `Strengths: ${a.strengths.join(', ') || 'not specified'}.`,
    `Career goals: ${a.careerGoals.join(', ') || 'not specified'}.`,
    `Math: ${a.mathPerformance}. Physics: ${a.physicsPerformance}. Chemistry: ${a.chemistryPerformance}.`,
    'Recommended branches and reasons:',
    tops || '- (none provided)',
    'Summarize why these branches fit, what to verify next, and one or two questions for the family.',
  ].join('\n')
}

export async function explainRecommendations(req: ExplainRequest): Promise<ExplainResponse> {
  if (!isAiConfigured) {
    return { source: 'fallback', summary: fallbackSummary(req) }
  }
  try {
    const summary = await generateText(buildPrompt(req))
    return { source: 'ai', summary }
  } catch {
    return { source: 'fallback', summary: fallbackSummary(req) }
  }
}
