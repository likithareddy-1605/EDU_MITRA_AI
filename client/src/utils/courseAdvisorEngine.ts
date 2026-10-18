// Transparent, rule-based branch scoring. This is a HEURISTIC, not a probability.
// It exists so the Course Advisor works fully in demo mode (no API key) and so
// recommendations are explainable. The optional AI path (backend) only adds a
// narrative summary on top of these same results.
import { branches, type BranchInfo, type CourseAssessment, type Proficiency } from '@/data/courseAdvisorData'

export interface BranchScore {
  id: string
  name: string
  short: string
  score: number // 0–100 heuristic match
  reasons: string[]
  tradeOff?: string
  branch: BranchInfo
}

function subjectProficiency(a: CourseAssessment, subject: string): Proficiency {
  if (subject === 'Mathematics') return a.mathPerformance
  if (subject === 'Physics') return a.physicsPerformance
  if (subject === 'Chemistry') return a.chemistryPerformance
  return 'unknown'
}

export function scoreBranches(a: CourseAssessment, list: BranchInfo[] = branches): BranchScore[] {
  const results = list.map((b) => {
    let raw = 0
    const reasons: string[] = []

    const interestHits = b.interestTags.filter((t) => a.interests.includes(t))
    raw += interestHits.length * 12
    if (interestHits.length) reasons.push(`Matches your interest in ${interestHits.join(', ')}`)

    const subjectHits = b.subjectTags.filter((s) => a.favouriteSubjects.includes(s))
    raw += subjectHits.length * 10
    if (subjectHits.length) reasons.push(`Aligns with favourite subject(s): ${subjectHits.join(', ')}`)

    const strengthHits = b.subjectTags.filter((s) => a.strengths.includes(s))
    raw += strengthHits.length * 6
    if (strengthHits.length) reasons.push(`Builds on your strength(s): ${strengthHits.join(', ')}`)

    const careerHits = b.careerPaths.filter((c) => a.careerGoals.includes(c))
    raw += careerHits.length * 12
    if (careerHits.length) reasons.push(`Supports career goal(s): ${careerHits.join(', ')}`)

    if (a.preferredBranches.includes(b.id)) {
      raw += 15
      reasons.push('You marked this as a preferred branch')
    }

    let tradeOff: string | undefined
    for (const subj of b.subjectTags) {
      const prof = subjectProficiency(a, subj)
      if (prof === 'weak') {
        raw -= 8
        if (!tradeOff) tradeOff = `Needs ${subj}, which you marked as needing work`
      } else if (prof === 'strong') {
        raw += 5
      }
    }

    const score = Math.max(0, Math.min(100, Math.round(raw)))
    return { id: b.id, name: b.name, short: b.short, score, reasons, tradeOff, branch: b }
  })
  return results.sort((x, y) => y.score - x.score)
}

/** Fields left blank or "unknown" — surfaced honestly in the report. */
export function missingInfo(a: CourseAssessment): string[] {
  const m: string[] = []
  if (!a.interests.length) m.push('Interests')
  if (!a.favouriteSubjects.length) m.push('Favourite subjects')
  if (!a.careerGoals.length) m.push('Career goals')
  if (a.mathPerformance === 'unknown') m.push('Mathematics performance')
  if (a.physicsPerformance === 'unknown') m.push('Physics performance')
  if (a.chemistryPerformance === 'unknown') m.push('Chemistry performance')
  if (!a.entranceExamName) m.push('Entrance examination')
  if (!a.annualTuitionBudget) m.push('Annual tuition budget')
  if (!a.preferredLocation) m.push('Preferred location')
  return m
}

export function discussionQuestions(a: CourseAssessment): string[] {
  const q: string[] = []
  q.push('Which branch best balances your interests and your career goals?')
  if (a.careerGoals.length) {
    q.push(`Do your career goals (${a.careerGoals.join(', ')}) lead to a clear first job, or to further study?`)
  }
  if (a.annualTuitionBudget) {
    q.push('Is the annual tuition budget comfortable for all four years, including living costs?')
  }
  if (a.preferredLocation) {
    q.push(`How important is studying in ${a.preferredLocation} versus choosing a better-fit branch elsewhere?`)
  }
  q.push('What backup option will you consider if your preferred branch is not available?')
  return q
}

export function suggestedNextSteps(): string[] {
  return [
    'Research the curriculum and subjects of your top 2 branches',
    'Verify admission requirements and entrance cutoffs on official college websites',
    'Compare tuition and living costs for 3 colleges',
    'Discuss location and hostel preferences with family',
    'Attend a counselling session or talk to a senior student',
  ]
}
