import type { TranslationKey } from '@/locales/en'

export interface RoadmapEntry {
  /** Which milestone this feature is scheduled for. */
  milestone: number
  /** Locale key used to render the feature title. */
  labelKey: TranslationKey
}

/**
 * Maps the `:feature` route parameter to roadmap metadata so a single
 * RoadmapPage can honestly describe what is coming and when — instead of
 * creating many near-identical placeholder files.
 */
export const roadmapRegistry: Record<string, RoadmapEntry> = {
  // Milestone 2
  academics: { milestone: 2, labelKey: 'nav.academics' },
  goals: { milestone: 2, labelKey: 'nav.goals' },
  'study-planner': { milestone: 2, labelKey: 'nav.studyPlanner' },
  progress: { milestone: 2, labelKey: 'nav.progress' },
  'academic-summary': { milestone: 2, labelKey: 'nav.academicSummary' },
  support: { milestone: 2, labelKey: 'nav.support' },
  'action-plan': { milestone: 2, labelKey: 'nav.actionPlan' },
  // Milestone 4
  'course-advisor': { milestone: 4, labelKey: 'nav.courseAdvisor' },
  // Milestone 5
  wellbeing: { milestone: 5, labelKey: 'nav.wellbeing' },
  resources: { milestone: 5, labelKey: 'nav.resources' },
  settings: { milestone: 5, labelKey: 'nav.settings' },
  career: { milestone: 3, labelKey: 'nav.career' },
}

/** Bullet points describing the Engineering Course Advisor (Milestone 4). */
export const courseAdvisorExpectations: string[] = [
  'Interest assessment (favourite & strongest subjects, hobbies, technical interests)',
  'Academic profile (Class 11/12 subjects, Maths/Physics/Chemistry, entrance score)',
  'Family budget (tuition, total degree budget, hostel, location, scholarship needs)',
  'Branch recommendations with explained fit, strengths, skills and trade-offs',
  'Side-by-side branch comparison across curriculum, skills and careers',
  'College options (only from verified data — none fabricated)',
  'Personalized, parent-friendly report with next steps and discussion questions',
]
