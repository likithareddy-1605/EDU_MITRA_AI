// Pure helpers that derive academic/progress stats from the student's own
// records. Keeping these pure (no React, no storage) makes them easy to reason
// about and reuse across pages.
import { formatDate } from '@/utils/format'
import type {
  AcademicRecord,
  Goal,
  Priority,
  SemesterSummary,
  StudentProfile,
  StudyActivity,
  StudyTask,
  SubjectPerformance,
} from '@/types'

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const round2 = (n: number): number => Math.round(n * 100) / 100

/** SGPA per semester = average subject marks / 10. */
export function computeSemesterGpas(records: AcademicRecord[]): SemesterSummary[] {
  const bySem = new Map<number, number[]>()
  for (const r of records) {
    const arr = bySem.get(r.semester)
    if (arr) arr.push(r.marks)
    else bySem.set(r.semester, [r.marks])
  }
  return [...bySem.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([semester, marks]) => ({
      semester,
      sgpa: round2(marks.reduce((s, m) => s + m, 0) / marks.length / 10),
    }))
}

/** CGPA = average of all recorded marks / 10. */
export function computeCgpa(records: AcademicRecord[]): number {
  if (records.length === 0) return 0
  const avg = records.reduce((s, r) => s + r.marks, 0) / records.length
  return round2(avg / 10)
}

/** Per-subject average marks plus a trend across the last two semesters. */
export function computeSubjectAverages(records: AcademicRecord[]): SubjectPerformance[] {
  const map = new Map<string, { total: number; count: number; bySem: Map<number, number> }>()
  for (const r of records) {
    let e = map.get(r.subject)
    if (!e) {
      e = { total: 0, count: 0, bySem: new Map() }
      map.set(r.subject, e)
    }
    e.total += r.marks
    e.count += 1
    e.bySem.set(r.semester, r.marks)
  }
  return [...map.entries()]
    .map(([subject, e]) => {
      const averageMarks = Math.round(e.total / e.count)
      const sems = [...e.bySem.entries()].sort((a, b) => a[0] - b[0])
      let trend: SubjectPerformance['trend'] = 'stable'
      if (sems.length >= 2) {
        const prev = sems[sems.length - 2][1]
        const last = sems[sems.length - 1][1]
        trend = last > prev ? 'up' : last < prev ? 'down' : 'stable'
      }
      return { subject, averageMarks, trend }
    })
    .sort((a, b) => b.averageMarks - a.averageMarks)
}

export function topSubjects(perf: SubjectPerformance[], n = 3): string[] {
  return perf.slice(0, n).map((p) => p.subject)
}

export function bottomSubjects(perf: SubjectPerformance[], n = 3): string[] {
  return [...perf].slice(-n).reverse().map((p) => p.subject)
}

export interface UpcomingItem {
  id: string
  title: string
  due: string
  priority: Priority
}

/** Future deadlines from goals + study tasks, soonest first. */
export function computeUpcoming(goals: Goal[], tasks: StudyTask[], limit = 6): UpcomingItem[] {
  const items: UpcomingItem[] = []
  const today = toISODate(new Date())
  for (const g of goals) {
    if (g.status === 'completed' || !g.deadline) continue
    if (g.deadline < today) continue
    items.push({
      id: `g-${g.id}`,
      title: g.title,
      due: g.deadline,
      priority: g.progress < 30 ? 'high' : 'medium',
    })
  }
  for (const t of tasks) {
    if (t.completed || !t.due) continue
    if (t.due < today) continue
    items.push({ id: `t-${t.id}`, title: t.title, due: t.due, priority: t.priority })
  }
  return items.sort((a, b) => a.due.localeCompare(b.due)).slice(0, limit)
}

export function goalProgressAverage(goals: Goal[]): number {
  const active = goals.filter((g) => g.status !== 'completed')
  if (active.length === 0) return 0
  return Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length)
}

/** Distinct days that have either logged activity or a completed study task. */
export function activeDaysSet(tasks: StudyTask[], activities: StudyActivity[]): Set<string> {
  const set = new Set<string>()
  for (const a of activities) set.add(a.date)
  for (const t of tasks) if (t.completed && t.completedAt) set.add(t.completedAt)
  return set
}

/** Consecutive active days ending today (or yesterday if today not yet active). */
export function computeStreak(tasks: StudyTask[], activities: StudyActivity[]): number {
  const days = activeDaysSet(tasks, activities)
  const cursor = new Date()
  if (!days.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(toISODate(cursor))) return 0
  }
  let streak = 0
  while (days.has(toISODate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function tasksCompletedLastDays(tasks: StudyTask[], days = 7): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffISO = toISODate(cutoff)
  return tasks.filter((t) => t.completed && t.completedAt && t.completedAt >= cutoffISO).length
}

export function recommendedNextAction(goals: Goal[], tasks: StudyTask[]): string {
  const next = computeUpcoming(goals, tasks, 1)[0]
  if (next) {
    return `Focus on "${next.title}" (due ${formatDate(next.due)}) — it is your nearest deadline.`
  }
  const lowGoal = goals.find((g) => g.status !== 'completed' && g.progress < 30)
  if (lowGoal) {
    return `Start your goal "${lowGoal.title}" — it is below 30% progress.`
  }
  return 'You are on track. Add a new goal or study task to keep momentum.'
}

export function profileCompleteness(profile: StudentProfile): number {
  const fields = [
    profile.displayName,
    profile.branch,
    profile.year,
    profile.college,
    profile.currentGoal,
    profile.preferredLearning,
  ]
  const filled = fields.filter((v) => Boolean(v && v.trim())).length
  const interests =
    (profile.academicInterests.length > 0 ? 1 : 0) + (profile.careerInterests.length > 0 ? 1 : 0)
  return Math.round(((filled + interests) / (fields.length + 2)) * 100)
}

/** Honest heuristic (NOT a validated metric). Blends profile + goal progress. */
export function readinessEstimate(profile: StudentProfile, goals: Goal[]): number {
  return Math.round((profileCompleteness(profile) + goalProgressAverage(goals)) / 2)
}
