import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type {
  AppUser,
  EngineeringEducationStage,
  ParentOnboardingData,
  StudentOnboardingData,
  UserRole,
} from '@/types'
import { isSupabaseClientConfigured, supabase } from '@/services/supabase'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

interface AuthContextValue {
  user: AppUser | null
  session: Session | null
  loading: boolean
  isDemoMode: boolean
  onboardingCompleted: boolean
  educationStage: EngineeringEducationStage | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    displayName: string,
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  completeStudentOnboarding: (data: StudentOnboardingData) => Promise<{ success: boolean; error?: string }>
  completeParentOnboarding: (data: ParentOnboardingData) => Promise<{ success: boolean; error?: string }>
  signInAsDemo: (role: UserRole) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEMO_USERS: Record<UserRole, AppUser> = {
  student: {
    id: 'demo-student-id',
    role: 'student',
    displayName: 'Aarav Sharma',
    email: 'aarav@edumitra.ai',
    onboardingCompleted: true,
    educationStage: 'studying',
  },
  parent: {
    id: 'demo-parent-id',
    role: 'parent',
    displayName: 'Mr. & Mrs. Sharma',
    email: 'parent@edumitra.ai',
    onboardingCompleted: true,
  },
  admin: {
    id: 'demo-admin-id',
    role: 'admin',
    displayName: 'Administrator',
    email: 'admin@edumitra.ai',
    onboardingCompleted: true,
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false)

  // Fetch verified profile from Supabase profiles table using RLS
  const loadVerifiedProfile = useCallback(async (sess: Session) => {
    if (!supabase) return null

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, display_name')
        .eq('id', sess.user.id)
        .maybeSingle()

      const role = (profile?.role || sess.user.user_metadata?.role || 'student') as UserRole
      const displayName =
        profile?.display_name ||
        sess.user.user_metadata?.display_name ||
        sess.user.email?.split('@')[0] ||
        (role === 'parent' ? 'Parent User' : 'Student User')

      // Check onboarding status
      let onboardingCompleted = false
      if (sess.user.user_metadata?.onboarding_completed === true) {
        onboardingCompleted = true
      } else if (sess.user.user_metadata?.onboarding_completed === false) {
        onboardingCompleted = false
      } else {
        // If not explicitly set in metadata, check if student profile has college or branch set
        const { data: stProfile } = await supabase
          .from('student_profiles')
          .select('college, branch')
          .eq('user_id', sess.user.id)
          .maybeSingle()

        onboardingCompleted = Boolean(stProfile?.college || stProfile?.branch)
      }

      const educationStage = (sess.user.user_metadata?.education_stage as EngineeringEducationStage) || null

      const appUser: AppUser = {
        id: sess.user.id,
        role,
        displayName,
        email: sess.user.email,
        onboardingCompleted,
        educationStage,
      }
      return appUser
    } catch {
      const role = (sess.user.user_metadata?.role || 'student') as UserRole
      return {
        id: sess.user.id,
        role,
        displayName: sess.user.user_metadata?.display_name || 'User',
        email: sess.user.email,
        onboardingCompleted: false,
      }
    }
  }, [])

  // Initialize session and subscribe to Supabase Auth state changes
  useEffect(() => {
    if (!isSupabaseClientConfigured || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        if (initialSession) {
          setSession(initialSession)
          const verifiedUser = await loadVerifiedProfile(initialSession)
          setUser(verifiedUser)
          setIsDemoMode(false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        const verifiedUser = await loadVerifiedProfile(newSession)
        setUser(verifiedUser)
        setIsDemoMode(false)
      } else {
        setUser((prev) => (prev?.id.startsWith('demo-') ? prev : null))
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadVerifiedProfile])

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (!isSupabaseClientConfigured || !supabase) {
        return { success: false, error: 'Supabase client is not configured' }
      }

      setLoading(true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (error) {
          setLoading(false)
          return { success: false, error: error.message }
        }

        if (data.session) {
          setSession(data.session)
          const verifiedUser = await loadVerifiedProfile(data.session)
          setUser(verifiedUser)
          setIsDemoMode(false)
          setLoading(false)
          return { success: true }
        }

        setLoading(false)
        return { success: false, error: 'No session created' }
      } catch (err: unknown) {
        setLoading(false)
        const msg = err instanceof Error ? err.message : 'Login failed'
        return { success: false, error: msg }
      }
    },
    [loadVerifiedProfile],
  )

  // Sign up with auto-confirmation via backend admin API, then establish Supabase session
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      role: UserRole,
      displayName: string,
    ): Promise<{ success: boolean; error?: string }> => {
      setLoading(true)
      const normalizedEmail = email.trim().toLowerCase()
      const trimmedName = displayName.trim()

      try {
        let backendError: string | null = null

        // 1. First attempt auto-confirmed registration via backend Admin API
        try {
          const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: normalizedEmail,
              password,
              role,
              displayName: trimmedName,
            }),
          })

          const resData = await res.json().catch(() => ({}))
          if (res.ok) {
            // User created and auto-confirmed! Sign in immediately:
            if (supabase) {
              const loginResult = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
              })

              if (loginResult.data.session) {
                setSession(loginResult.data.session)
                const verifiedUser = await loadVerifiedProfile(loginResult.data.session)
                setUser(verifiedUser)
                setIsDemoMode(false)
                setLoading(false)
                return { success: true }
              }
            }
            setLoading(false)
            return { success: true }
          } else {
            backendError = resData.error || 'Backend registration failed'
          }
        } catch (fetchErr: unknown) {
          backendError = fetchErr instanceof Error ? fetchErr.message : 'Backend unreachable'
        }

        // 2. Resilient fallback: If backend admin call fails (e.g. invalid service_role key),
        // try standard client-side Supabase Auth registration using the public anon key.
        if (supabase) {
          console.warn('[AuthContext] Backend admin registration failed, trying direct Supabase Auth:', backendError)
          const { data: clientData, error: clientError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: {
                role,
                display_name: trimmedName,
                onboarding_completed: false,
              },
            },
          })

          if (clientError) {
            setLoading(false)
            return { success: false, error: clientError.message || backendError || 'Registration failed' }
          }

          if (clientData.session) {
            setSession(clientData.session)
            const verifiedUser = await loadVerifiedProfile(clientData.session)
            setUser(verifiedUser)
            setIsDemoMode(false)
            setLoading(false)
            return { success: true }
          } else if (clientData.user) {
            // User created, confirmation email sent if SMTP enabled
            setLoading(false)
            return {
              success: true,
              error: 'Account created! Please check your email to confirm registration or sign in.',
            }
          }
        }

        setLoading(false)
        return { success: false, error: backendError || 'Signup failed' }
      } catch (err: unknown) {
        setLoading(false)
        const msg = err instanceof Error ? err.message : 'Signup failed'
        return { success: false, error: msg }
      }
    },
    [loadVerifiedProfile],
  )

  // Complete Student Onboarding
  const completeStudentOnboarding = useCallback(
    async (data: StudentOnboardingData): Promise<{ success: boolean; error?: string }> => {
      if (!session?.user?.id || !supabase) {
        return { success: false, error: 'User is not authenticated' }
      }

      try {
        const userId = session.user.id

        // 1. Update Supabase Auth user_metadata (strictly keep role: 'student')
        await supabase.auth.updateUser({
          data: {
            role: 'student',
            onboarding_completed: true,
            education_stage: data.stage,
            onboarding_data: data,
          },
        })

        // Also ensure public.profiles has role: 'student'
        await supabase.from('profiles').update({ role: 'student' }).eq('id', userId)

        // 2. Persist to student_profiles table
        const profilePayload =
          data.stage === 'planning'
            ? {
                user_id: userId,
                branch: data.preferredBranches.join(', ') || 'Exploring Engineering',
                year: data.currentQualification || 'Planning: Aspirant',
                college: data.preferredLocation
                  ? `Aspirant (Location: ${data.preferredLocation})`
                  : 'Planning for College',
                cgpa: 0,
                academic_interests: data.academicInterests,
                career_interests: data.careerGoals,
                current_goal: data.entranceExam
                  ? `Target ${data.entranceExam}${
                      data.entranceScoreOrRank ? ' (' + data.entranceScoreOrRank + ')' : ''
                    }`
                  : 'Explore Engineering Branches',
                preferred_learning: data.expectedBudget
                  ? `Budget: ${data.expectedBudget}`
                  : 'Hands-on projects & guidance',
                updated_at: new Date().toISOString(),
              }
            : {
                user_id: userId,
                branch: data.branch,
                year: `${data.year} (${data.semester})`,
                college: data.college,
                cgpa: Number(data.cgpa) || 0,
                academic_interests: data.strongSubjects,
                career_interests: data.careerGoals,
                current_goal: `Maintain CGPA and master ${data.careerGoals[0] || 'core engineering'}`,
                preferred_learning: data.dailyStudyHours
                  ? `Daily ${data.dailyStudyHours} hrs study | ${data.preferredLearning || 'Practical'}`
                  : data.preferredLearning || 'Hands-on projects',
                updated_at: new Date().toISOString(),
              }

        const { error: profileErr } = await supabase.from('student_profiles').upsert(profilePayload)

        if (profileErr) {
          console.warn('[completeStudentOnboarding] student_profiles upsert note:', profileErr)
        }

        setUser((prev) =>
          prev
            ? {
                ...prev,
                role: 'student',
                onboardingCompleted: true,
                educationStage: data.stage,
              }
            : null,
        )

        return { success: true }
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to save onboarding',
        }
      }
    },
    [session],
  )

  // Complete Parent Onboarding
  const completeParentOnboarding = useCallback(
    async (data: ParentOnboardingData): Promise<{ success: boolean; error?: string }> => {
      if (!session?.user?.id || !supabase) {
        return { success: false, error: 'User is not authenticated' }
      }

      try {
        await supabase.auth.updateUser({
          data: {
            role: 'parent',
            onboarding_completed: true,
            parent_onboarding: data,
          },
        })

        await supabase.from('profiles').update({ role: 'parent' }).eq('id', session.user.id)

        if (data.relationship && user?.displayName) {
          const updatedName = `${user.displayName} (${data.relationship})`
          try {
            await supabase
              .from('profiles')
              .update({ display_name: updatedName, role: 'parent' })
              .eq('id', session.user.id)
          } catch {
            /* ignore optional display name update */
          }

          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  role: 'parent',
                  displayName: updatedName,
                  onboardingCompleted: true,
                }
              : null,
          )
        } else {
          setUser((prev) => (prev ? { ...prev, role: 'parent', onboardingCompleted: true } : null))
        }

        return { success: true }
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to save onboarding',
        }
      }
    },
    [session, user?.displayName],
  )

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true)
    if (supabase) {
      await supabase.auth.signOut().catch(() => {})
    }
    setSession(null)
    setUser(null)
    setIsDemoMode(false)
    setLoading(false)
  }, [])

  // Password reset request
  const resetPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      if (!isSupabaseClientConfigured || !supabase) {
        return { success: false, error: 'Supabase client is not configured' }
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
        if (error) return { success: false, error: error.message }
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Password reset failed' }
      }
    },
    [],
  )

  // Explicit demo fallback
  const signInAsDemo = useCallback((role: UserRole) => {
    setUser(DEMO_USERS[role])
    setIsDemoMode(true)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isDemoMode,
      onboardingCompleted: isDemoMode ? true : Boolean(user?.onboardingCompleted),
      educationStage: user?.educationStage || null,
      signIn,
      signUp,
      signOut,
      resetPassword,
      completeStudentOnboarding,
      completeParentOnboarding,
      signInAsDemo,
    }),
    [
      user,
      session,
      loading,
      isDemoMode,
      signIn,
      signUp,
      signOut,
      resetPassword,
      completeStudentOnboarding,
      completeParentOnboarding,
      signInAsDemo,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
