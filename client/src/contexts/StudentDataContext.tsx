import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AcademicRecord,
  Achievement,
  Goal,
  StudentData,
  StudentProfile,
  StudyActivity,
  StudyTask,
} from '@/types'
import { seedStudentData } from '@/data/seedData'
import {
  isSupabaseClientConfigured,
  supabase,
  fetchRemoteProfile,
  fetchRemoteAcademicRecords,
  fetchRemoteGoals,
  fetchRemoteTasks,
  saveRemoteGoal,
} from '@/services/supabase'

const STORAGE_KEY = 'edumitra.studentData'

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function genInitialActivities(): StudyActivity[] {
  const out: StudyActivity[] = []
  for (let i = 0; i < 3; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push({ id: `seed-act-${i}`, date: toISODate(d) })
  }
  return out
}

function createInitial(): StudentData {
  return { ...seedStudentData, activities: genInitialActivities() }
}

function load(): StudentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StudentData
  } catch {
    /* ignore malformed storage */
  }
  return createInitial()
}

export interface StudentDataApi {
  data: StudentData
  resetDemo: () => void
  updateProfile: (patch: Partial<StudentProfile>) => void
  addRecord: (record: Omit<AcademicRecord, 'id'>) => void
  updateRecord: (id: string, patch: Partial<AcademicRecord>) => void
  deleteRecord: (id: string) => void
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  toggleGoalComplete: (id: string) => void
  addTask: (task: Omit<StudyTask, 'id' | 'completed'>) => void
  updateTask: (id: string, patch: Partial<StudyTask>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  logStudyToday: () => void
  addAchievement: (a: Omit<Achievement, 'id'>) => void
  deleteAchievement: (id: string) => void
}

// eslint-disable-next-line react-refresh/only-export-components -- context + provider only; hook lives in hooks/useStudentData.ts
export const StudentDataContext = createContext<StudentDataApi | undefined>(undefined)

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StudentData>(load)

  // Save to local storage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* storage full or blocked */
    }
  }, [data])

  // Remote fetch from Supabase when client is configured and session exists
  useEffect(() => {
    if (!isSupabaseClientConfigured || !supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      const userId = session.user.id

      Promise.all([
        fetchRemoteProfile(userId),
        fetchRemoteAcademicRecords(userId),
        fetchRemoteGoals(userId, false),
        fetchRemoteTasks(userId),
      ])
        .then(([remProfile, remRecords, remGoals, remTasks]) => {
          setData((prev) => ({
            ...prev,
            profile: remProfile ? { ...prev.profile, ...remProfile } : prev.profile,
            records: remRecords && remRecords.length > 0 ? remRecords : prev.records,
            goals: remGoals && remGoals.length > 0 ? remGoals : prev.goals,
            tasks: remTasks && remTasks.length > 0 ? remTasks : prev.tasks,
          }))
        })
        .catch(() => {
          /* fail gracefully to local demo data */
        })
    })
  }, [])

  const updateProfile = useCallback(
    (patch: Partial<StudentProfile>) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch } })),
    [],
  )

  const addRecord = useCallback(
    (record: Omit<AcademicRecord, 'id'>) =>
      setData((d) => ({ ...d, records: [...d.records, { ...record, id: uid('rec') }] })),
    [],
  )
  const updateRecord = useCallback(
    (id: string, patch: Partial<AcademicRecord>) =>
      setData((d) => ({ ...d, records: d.records.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
    [],
  )
  const deleteRecord = useCallback(
    (id: string) => setData((d) => ({ ...d, records: d.records.filter((r) => r.id !== id) })),
    [],
  )

  const addGoal = useCallback(
    (goal: Omit<Goal, 'id'>) => {
      const newGoal: Goal = { ...goal, id: uid('goal') }
      setData((d) => ({ ...d, goals: [...d.goals, newGoal] }))

      if (isSupabaseClientConfigured && supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id) {
            saveRemoteGoal(session.user.id, newGoal).catch(() => {})
          }
        })
      }
    },
    [],
  )
  const updateGoal = useCallback(
    (id: string, patch: Partial<Goal>) =>
      setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
    [],
  )
  const deleteGoal = useCallback(
    (id: string) => setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) })),
    [],
  )
  const toggleGoalComplete = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        goals: d.goals.map((g) =>
          g.id === id
            ? {
                ...g,
                status: g.status === 'completed' ? 'in_progress' : 'completed',
                progress: g.status === 'completed' ? g.progress : 100,
              }
            : g,
        ),
      })),
    [],
  )

  const addTask = useCallback(
    (task: Omit<StudyTask, 'id' | 'completed'>) =>
      setData((d) => ({ ...d, tasks: [...d.tasks, { ...task, id: uid('task'), completed: false }] })),
    [],
  )
  const updateTask = useCallback(
    (id: string, patch: Partial<StudyTask>) =>
      setData((d) => ({ ...d, tasks: d.tasks.map((tk) => (tk.id === id ? { ...tk, ...patch } : tk)) })),
    [],
  )
  const deleteTask = useCallback(
    (id: string) => setData((d) => ({ ...d, tasks: d.tasks.filter((tk) => tk.id !== id) })),
    [],
  )
  const toggleTask = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((tk) =>
          tk.id === id
            ? { ...tk, completed: !tk.completed, completedAt: !tk.completed ? toISODate(new Date()) : undefined }
            : tk,
        ),
      })),
    [],
  )

  const logStudyToday = useCallback(() => {
    const today = toISODate(new Date())
    setData((d) =>
      d.activities.some((a) => a.date === today)
        ? d
        : { ...d, activities: [...d.activities, { id: uid('act'), date: today }] },
    )
  }, [])

  const addAchievement = useCallback(
    (a: Omit<Achievement, 'id'>) =>
      setData((d) => ({ ...d, achievements: [{ ...a, id: uid('ach') }, ...d.achievements] })),
    [],
  )
  const deleteAchievement = useCallback(
    (id: string) => setData((d) => ({ ...d, achievements: d.achievements.filter((a) => a.id !== id) })),
    [],
  )

  const resetDemo = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setData(createInitial())
  }, [])

  const value = useMemo<StudentDataApi>(
    () => ({
      data,
      resetDemo,
      updateProfile,
      addRecord,
      updateRecord,
      deleteRecord,
      addGoal,
      updateGoal,
      deleteGoal,
      toggleGoalComplete,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      logStudyToday,
      addAchievement,
      deleteAchievement,
    }),
    [
      data,
      resetDemo,
      updateProfile,
      addRecord,
      updateRecord,
      deleteRecord,
      addGoal,
      updateGoal,
      deleteGoal,
      toggleGoalComplete,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      logStudyToday,
      addAchievement,
      deleteAchievement,
    ],
  )

  return <StudentDataContext.Provider value={value}>{children}</StudentDataContext.Provider>
}
