// Shared domain types for EduMitra AI.
// These describe the shape of the data that flows through the app. The database
// entities (Supabase/Postgres) will map onto these in later milestones.

export type UserRole = 'student' | 'parent' | 'admin'
export type LanguageCode = 'en' | 'te'

export interface AppUser {
  id: string
  role: UserRole
  displayName: string
}

export type GoalCategory =
  | 'academic'
  | 'programming'
  | 'project'
  | 'certification'
  | 'internship'
  | 'placement'
  | 'career'

export type GoalStatus = 'not_started' | 'in_progress' | 'completed'

export interface Goal {
  id: string
  title: string
  category: GoalCategory
  status: GoalStatus
  progress: number // 0–100
  deadline?: string // ISO date
  /** Whether the student has authorized the parent to see this goal. */
  shared: boolean
}

export interface SemesterSummary {
  semester: number
  sgpa: number
}

export interface AcademicRecord {
  id: string
  semester: number
  subject: string
  marks: number // out of 100
  grade: string
}

export type PerformanceTrend = 'up' | 'down' | 'stable'

export interface SubjectPerformance {
  subject: string
  averageMarks: number
  trend: PerformanceTrend
}

export type AchievementType = 'project' | 'certification' | 'goal' | 'award'

export interface Achievement {
  id: string
  title: string
  date: string // ISO date
  type: AchievementType
}

export type ActivityType = 'exam' | 'assignment' | 'deadline' | 'session'
export type Priority = 'high' | 'medium' | 'low'

export interface UpcomingActivity {
  id: string
  title: string
  type: ActivityType
  due: string // ISO date
  priority: Priority
}

export interface StudentProfile {
  id: string
  displayName: string
  branch: string
  year: string
  college: string
  cgpa: number
  academicInterests: string[]
  careerInterests: string[]
  currentGoal: string
  preferredLearning: string
}

export interface SupportSuggestion {
  id: string
  title: string
  detail: string
}

export type ActionOwner = 'student' | 'family'
export type ActionStatus = 'pending' | 'done'

export interface ActionItem {
  id: string
  title: string
  owner: ActionOwner
  status: ActionStatus
}

/** All the data the student dashboard renders in this demo. */
export interface DemoStudentData {
  profile: StudentProfile
  semesterGpas: SemesterSummary[]
  records: AcademicRecord[]
  subjectPerformance: SubjectPerformance[]
  goals: Goal[]
  achievements: Achievement[]
  upcoming: UpcomingActivity[]
  strengths: string[]
  improvementAreas: string[]
  recommendedNextAction: string
  learningStreakDays: number
  readinessScore: number // 0–100
}

/** All the data the parent dashboard renders in this demo. */
export interface DemoParentData {
  studentName: string
  academicSummary: string
  sharedGoals: Goal[]
  recentAchievements: Achievement[]
  supportSuggestions: SupportSuggestion[]
  actionPlan: ActionItem[]
}

// --- Milestone 2: editable student data (stored locally in the browser) ----
// This is demo-only local persistence — NOT a cloud database. It is clearly
// labelled in the UI so we never imply data is saved on a server.

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export interface StudyTask {
  id: string
  title: string
  subject: string
  day: WeekDay
  priority: Priority
  completed: boolean
  /** ISO date set when the task is marked complete — feeds the learning streak. */
  completedAt?: string
  /** Optional ISO deadline date. */
  due?: string
}

export interface StudyActivity {
  id: string
  /** ISO date (yyyy-mm-dd) the student recorded study activity. */
  date: string
  minutes?: number
}

/** Editable student data persisted to localStorage (demo only). */
export interface StudentData {
  profile: StudentProfile
  records: AcademicRecord[]
  goals: Goal[]
  tasks: StudyTask[]
  activities: StudyActivity[]
  achievements: Achievement[]
}

// --- Family Decision (Module E) -------------------------------------------
// Stored separately in localStorage so it can be read by both student and
// parent views in the demo. In production this would be a Supabase row.

export interface FamilyPreference {
  preferredBranchId: string
  notes: string
}

export interface FamilyDecision {
  /** Branch IDs selected for comparison (2–3). */
  selectedBranchIds: string[]
  studentPreference: FamilyPreference
  parentPreference: FamilyPreference
  /** The branch ID the family ultimately chose. Empty string = not decided yet. */
  finalBranchId: string
  rationale: string
  concerns: string
  tradeOffs: string
  /** ISO date-time when saved. */
  savedAt: string | null
}

export const emptyFamilyDecision: FamilyDecision = {
  selectedBranchIds: [],
  studentPreference: { preferredBranchId: '', notes: '' },
  parentPreference: { preferredBranchId: '', notes: '' },
  finalBranchId: '',
  rationale: '',
  concerns: '',
  tradeOffs: '',
  savedAt: null,
}
