import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { AcademicRecord, Goal, StudentProfile, StudyTask } from '@/types'

function normalizeSupabaseUrl(url: string | undefined): string {
  if (!url) return ''
  const cleaned = url.trim().replace(/^["']|["']$/g, '').trim()
  try {
    const parsed = new URL(cleaned)
    return parsed.origin
  } catch {
    return cleaned.replace(/\/rest\/v1\/?$/, '').replace(/\/auth\/v1\/?$/, '').replace(/\/$/, '')
  }
}

// Retrieve Supabase environment variables and normalize to root project URL
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
const supabasePublishableKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim()?.replace(/^["']|["']$/g, '') ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()?.replace(/^["']|["']$/g, '') ||
  ''
)

export const supabaseUrl: string = normalizeSupabaseUrl(rawSupabaseUrl)

// Check if credentials are real and not placeholder defaults
function isValidConfig(url: string, key: string): boolean {
  if (!url || !key) return false
  if (url.includes('your-project') || url.includes('placeholder')) return false
  if (key.includes('your_supabase') || key.includes('placeholder')) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export const isSupabaseClientConfigured: boolean = isValidConfig(supabaseUrl, supabasePublishableKey)

// Client instance (null when running in demo/offline mode)
export const supabase: SupabaseClient | null = isSupabaseClientConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

// --- Supabase Auth Helpers ---------------------------------------------------

export async function getSupabaseUser(): Promise<User | null> {
  if (!supabase) return null
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function signOutSupabase(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

// --- Data Layer Helpers (Connected to supabase/schema.sql) -------------------

/** Fetches student profile from Supabase */
export async function fetchRemoteProfile(userId: string): Promise<Partial<StudentProfile> | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('branch, year, college, cgpa, academic_interests, career_interests, current_goal, preferred_learning')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return {
      branch: data.branch,
      year: data.year,
      college: data.college,
      cgpa: Number(data.cgpa) || 0,
      academicInterests: data.academic_interests || [],
      careerInterests: data.career_interests || [],
      currentGoal: data.current_goal || '',
      preferredLearning: data.preferred_learning || '',
    }
  } catch {
    return null
  }
}

/** Fetches academic records for a student */
export async function fetchRemoteAcademicRecords(studentId: string): Promise<AcademicRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('academic_records')
      .select('id, semester, subject, marks, grade')
      .eq('student_id', studentId)
      .order('semester', { ascending: true })

    if (error || !data) return null
    return data.map((r) => ({
      id: r.id,
      semester: r.semester,
      subject: r.subject,
      marks: Number(r.marks),
      grade: r.grade,
    }))
  } catch {
    return null
  }
}

/**
 * Fetches goals for a student.
 * If isParent is true, strictly queries only shared goals (in addition to RLS).
 */
export async function fetchRemoteGoals(studentId: string, isParent = false): Promise<Goal[] | null> {
  if (!supabase) return null
  try {
    let query = supabase
      .from('goals')
      .select('id, title, category, status, progress, deadline, shared')
      .eq('student_id', studentId)

    if (isParent) {
      query = query.eq('shared', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error || !data) return null
    return data.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      status: g.status,
      progress: g.progress,
      deadline: g.deadline ?? undefined,
      shared: g.shared,
    }))
  } catch {
    return null
  }
}

/** Saves or updates a student goal in Supabase */
export async function saveRemoteGoal(studentId: string, goal: Goal): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('goals').upsert({
      id: goal.id.startsWith('goal-') ? undefined : goal.id,
      student_id: studentId,
      title: goal.title,
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      deadline: goal.deadline || null,
      shared: goal.shared,
      updated_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return false
  }
}

/** Fetches study tasks from Supabase */
export async function fetchRemoteTasks(studentId: string): Promise<StudyTask[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('study_tasks')
      .select('id, title, subject, day, priority, completed, completed_at, due')
      .eq('student_id', studentId)

    if (error || !data) return null
    return data.map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      day: t.day,
      priority: t.priority,
      completed: t.completed,
      completedAt: t.completed_at ?? undefined,
      due: t.due ?? undefined,
    }))
  } catch {
    return null
  }
}

/** Saves student profile patch to Supabase student_profiles table */
export async function saveRemoteProfile(userId: string, patch: Partial<StudentProfile>): Promise<boolean> {
  if (!supabase) return false
  try {
    const payload: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    }
    if (patch.branch !== undefined) payload.branch = patch.branch
    if (patch.year !== undefined) payload.year = patch.year
    if (patch.college !== undefined) payload.college = patch.college
    if (patch.cgpa !== undefined) payload.cgpa = patch.cgpa
    if (patch.academicInterests !== undefined) payload.academic_interests = patch.academicInterests
    if (patch.careerInterests !== undefined) payload.career_interests = patch.careerInterests
    if (patch.currentGoal !== undefined) payload.current_goal = patch.currentGoal
    if (patch.preferredLearning !== undefined) payload.preferred_learning = patch.preferredLearning

    const { error } = await supabase.from('student_profiles').upsert(payload)
    return !error
  } catch {
    return false
  }
}

/** Deletes a goal from Supabase */
export async function deleteRemoteGoal(goalId: string): Promise<boolean> {
  if (!supabase || goalId.startsWith('goal-') || goalId.startsWith('seed-')) return false
  try {
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    return !error
  } catch {
    return false
  }
}

/** Saves or updates a study task in Supabase */
export async function saveRemoteTask(studentId: string, task: StudyTask): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('study_tasks').upsert({
      id: task.id.startsWith('task-') || task.id.startsWith('seed-') ? undefined : task.id,
      student_id: studentId,
      title: task.title,
      subject: task.subject,
      day: task.day,
      priority: task.priority,
      completed: task.completed,
      completed_at: task.completedAt || null,
      due: task.due || null,
    })
    return !error
  } catch {
    return false
  }
}

/** Deletes a study task from Supabase */
export async function deleteRemoteTask(taskId: string): Promise<boolean> {
  if (!supabase || taskId.startsWith('task-') || taskId.startsWith('seed-')) return false
  try {
    const { error } = await supabase.from('study_tasks').delete().eq('id', taskId)
    return !error
  } catch {
    return false
  }
}

/** Saves or updates an academic record in Supabase */
export async function saveRemoteAcademicRecord(studentId: string, record: AcademicRecord): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('academic_records').upsert({
      id: record.id.startsWith('rec-') || record.id.startsWith('seed-') ? undefined : record.id,
      student_id: studentId,
      semester: record.semester,
      subject: record.subject,
      marks: record.marks,
      grade: record.grade,
    })
    return !error
  } catch {
    return false
  }
}

/** Deletes an academic record from Supabase */
export async function deleteRemoteAcademicRecord(recordId: string): Promise<boolean> {
  if (!supabase || recordId.startsWith('rec-') || recordId.startsWith('seed-')) return false
  try {
    const { error } = await supabase.from('academic_records').delete().eq('id', recordId)
    return !error
  } catch {
    return false
  }
}

