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
  deleteRemoteGoal,
  saveRemoteProfile,
  saveRemoteAcademicRecord,
  deleteRemoteAcademicRecord,
  saveRemoteTask,
  deleteRemoteTask,
} from '@/services/supabase'
import { fetchParentLinkedStudent } from '@/services/parentStudentLink'

import { useAuth } from '@/hooks/useAuth'

const DEMO_STORAGE_KEY = 'edumitra.studentData.demo'

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

function createEmptyStudentData(userId = 'user', displayName = 'Student'): StudentData {
  return {
    profile: {
      id: userId,
      displayName,
      branch: '',
      year: '',
      college: '',
      cgpa: 0,
      academicInterests: [],
      careerInterests: [],
      currentGoal: 'Complete setup & explore engineering roadmap',
      preferredLearning: 'Practical projects & self-study',
    },
    records: [],
    goals: [],
    tasks: [],
    activities: [],
    achievements: [],
  }
}

export interface StudentDataApi {
  data: StudentData
  refresh: () => Promise<void>
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
  const { user, isDemoMode } = useAuth()

  const currentStorageKey = useMemo(() => {
    if (isDemoMode) return DEMO_STORAGE_KEY
    if (user?.id) return `edumitra.studentData.${user.id}`
    return DEMO_STORAGE_KEY
  }, [isDemoMode, user?.id])

  const [data, setData] = useState<StudentData>(() => {
    if (isDemoMode || !user) {
      try {
        const raw = localStorage.getItem(DEMO_STORAGE_KEY)
        if (raw) return JSON.parse(raw) as StudentData
      } catch {}
      return createInitial()
    }
    try {
      const raw = localStorage.getItem(`edumitra.studentData.${user.id}`)
      if (raw) return JSON.parse(raw) as StudentData
    } catch {}
    return createEmptyStudentData(user.id, user.role === 'parent' ? '' : user.displayName)
  })

  // Synchronize active mode / user data switch
  useEffect(() => {
    if (isDemoMode) {
      try {
        const raw = localStorage.getItem(DEMO_STORAGE_KEY)
        setData(raw ? JSON.parse(raw) : createInitial())
      } catch {
        setData(createInitial())
      }
    } else if (user) {
      const userKey = `edumitra.studentData.${user.id}`
      let loaded: StudentData | null = null
      try {
        const raw = localStorage.getItem(userKey)
        if (raw) loaded = JSON.parse(raw)
      } catch {}

      if (loaded) {
        setData(loaded)
      } else {
        setData(createEmptyStudentData(user.id, user.role === 'parent' ? '' : user.displayName))
      }
    }
  }, [isDemoMode, user?.id, user?.displayName, user?.role])

  // Save to current user-scoped local storage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(currentStorageKey, JSON.stringify(data))
    } catch {
      /* storage full or blocked */
    }
  }, [currentStorageKey, data])

  // Remote fetch from Supabase and subscription to auth session changes
  const syncWithRemote = useCallback(async (userId: string, userRole?: string) => {
    try {
      if (userRole === 'parent') {
        const linkStatus = await fetchParentLinkedStudent(userId)
        if (linkStatus.linked && linkStatus.status === 'approved' && linkStatus.student) {
          const st = linkStatus.student
          const finalRecords =
            Array.isArray(st.records) && st.records.length > 0
              ? st.records
              : (await fetchRemoteAcademicRecords(st.id)) || []
          const finalGoals =
            Array.isArray(st.goals) && st.goals.length > 0
              ? st.goals
              : (await fetchRemoteGoals(st.id, true)) || []

          setData({
            profile: {
              id: st.id,
              displayName: st.displayName,
              branch: st.branch,
              year: st.year,
              semester: st.semester,
              college: st.college,
              cgpa: st.cgpa,
              academicInterests: st.academicInterests || [],
              careerInterests: st.careerInterests || [],
              strongSubjects: st.strongSubjects || [],
              weakSubjects: st.weakSubjects || [],
              currentGoal: st.currentGoal || 'Maintain strong academics & career skills',
              preferredLearning: st.preferredLearning || 'Guided study and practical skills',
            },
            records: finalRecords,
            goals: finalGoals,
            tasks: [],
            activities: [],
            achievements: [],
          })
        } else {
          setData(createEmptyStudentData(userId, ''))
        }
        return
      }

      // Student role: fetch personal records, profile, goals, tasks
      const [remProfile, remRecords, remGoals, remTasks] = await Promise.all([
        fetchRemoteProfile(userId),
        fetchRemoteAcademicRecords(userId),
        fetchRemoteGoals(userId, false),
        fetchRemoteTasks(userId),
      ])

      setData((prev) => ({
        ...prev,
        profile: remProfile ? { ...prev.profile, ...remProfile } : prev.profile,
        records: remRecords !== null ? remRecords : prev.records,
        goals: remGoals !== null ? remGoals : prev.goals,
        tasks: remTasks !== null ? remTasks : prev.tasks,
      }))
    } catch {
      /* fail gracefully to local storage */
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseClientConfigured || !supabase || isDemoMode || !user?.id) return
    syncWithRemote(user.id, user.role)
  }, [user?.id, user?.role, isDemoMode, syncWithRemote])

  const isRemoteAllowed = !isDemoMode && user?.role === 'student' && isSupabaseClientConfigured && Boolean(supabase)

  const updateProfile = useCallback((patch: Partial<StudentProfile>) => {
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }))
    if (isRemoteAllowed) {
      supabase!.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) saveRemoteProfile(session.user.id, patch).catch(() => {})
      })
    }
  }, [isRemoteAllowed])

  const addRecord = useCallback((record: Omit<AcademicRecord, 'id'>) => {
    const newRecord: AcademicRecord = { ...record, id: uid('rec') }
    setData((d) => ({ ...d, records: [...d.records, newRecord] }))
    if (isRemoteAllowed) {
      supabase!.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) saveRemoteAcademicRecord(session.user.id, newRecord).catch(() => {})
      })
    }
  }, [isRemoteAllowed])

  const updateRecord = useCallback((id: string, patch: Partial<AcademicRecord>) => {
    setData((d) => {
      const updated = d.records.map((r) => (r.id === id ? { ...r, ...patch } : r))
      const target = updated.find((r) => r.id === id)
      if (target && isRemoteAllowed) {
        supabase!.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id) saveRemoteAcademicRecord(session.user.id, target).catch(() => {})
        })
      }
      return { ...d, records: updated }
    })
  }, [isRemoteAllowed])

  const deleteRecord = useCallback((id: string) => {
    setData((d) => ({ ...d, records: d.records.filter((r) => r.id !== id) }))
    if (isRemoteAllowed) {
      deleteRemoteAcademicRecord(id).catch(() => {})
    }
  }, [isRemoteAllowed])

  const addGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { ...goal, id: uid('goal') }
    setData((d) => ({ ...d, goals: [...d.goals, newGoal] }))

    if (isRemoteAllowed) {
      supabase!.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          saveRemoteGoal(session.user.id, newGoal).catch(() => {})
        }
      })
    }
  }, [isRemoteAllowed])

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setData((d) => {
      const updated = d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g))
      const target = updated.find((g) => g.id === id)
      if (target && isRemoteAllowed) {
        supabase!.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id) saveRemoteGoal(session.user.id, target).catch(() => {})
        })
      }
      return { ...d, goals: updated }
    })
  }, [isRemoteAllowed])

  const deleteGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }))
    if (isRemoteAllowed) {
      deleteRemoteGoal(id).catch(() => {})
    }
  }, [isRemoteAllowed])

  const toggleGoalComplete = useCallback((id: string) => {
    setData((d) => {
      const updated = d.goals.map((g) =>
        g.id === id
          ? {
              ...g,
              status: (g.status === 'completed' ? 'in_progress' : 'completed') as Goal['status'],
              progress: g.status === 'completed' ? g.progress : 100,
            }
          : g,
      )
      const target = updated.find((g) => g.id === id)
      if (target && isRemoteAllowed) {
        supabase!.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id) saveRemoteGoal(session.user.id, target).catch(() => {})
        })
      }
      return { ...d, goals: updated }
    })
  }, [isRemoteAllowed])

  const addTask = useCallback((task: Omit<StudyTask, 'id' | 'completed'>) => {
    const newTask: StudyTask = { ...task, id: uid('task'), completed: false }
    setData((d) => ({ ...d, tasks: [...d.tasks, newTask] }))
    if (isRemoteAllowed) {
      supabase!.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) saveRemoteTask(session.user.id, newTask).catch(() => {})
      })
    }
  }, [isRemoteAllowed])

  const updateTask = useCallback((id: string, patch: Partial<StudyTask>) => {
    setData((d) => {
      const updated = d.tasks.map((tk) => (tk.id === id ? { ...tk, ...patch } : tk))
      const target = updated.find((tk) => tk.id === id)
      if (target && isRemoteAllowed) {
        supabase!.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id) saveRemoteTask(session.user.id, target).catch(() => {})
        })
      }
      return { ...d, tasks: updated }
    })
  }, [isRemoteAllowed])

  const deleteTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((tk) => tk.id !== id) }))
    if (isRemoteAllowed) {
      deleteRemoteTask(id).catch(() => {})
    }
  }, [isRemoteAllowed])

  const toggleTask = useCallback((id: string) => {
    setData((d) => {
      const updated = d.tasks.map((tk) =>
        tk.id === id
          ? { ...tk, completed: !tk.completed, completedAt: !tk.completed ? toISODate(new Date()) : undefined }
          : tk,
      )
      const target = updated.find((tk) => tk.id === id)
      if (target && isRemoteAllowed) {
        supabase!.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id) saveRemoteTask(session.user.id, target).catch(() => {})
        })
      }
      return { ...d, tasks: updated }
    })
  }, [isRemoteAllowed])

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
      localStorage.removeItem(currentStorageKey)
    } catch {
      /* ignore */
    }
    setData(createInitial())
  }, [currentStorageKey])

  const refresh = useCallback(async () => {
    if (!user?.id || isDemoMode) return
    await syncWithRemote(user.id, user.role)
  }, [user?.id, user?.role, isDemoMode, syncWithRemote])

  const value = useMemo<StudentDataApi>(
    () => ({
      data,
      refresh,
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
      refresh,
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
