import { env, isSupabaseConfigured } from '../utils/env'

export interface SignUpParams {
  email: string
  password: string
  role: 'student' | 'parent'
  displayName: string
}

export interface AuthUser {
  id: string
  email: string
  role: 'student' | 'parent'
  displayName: string
}

/**
 * Creates an auto-confirmed user in Supabase Auth and inserts their profile
 * record into public.profiles. Avoids SMTP rate-limit failures on Supabase free tier.
 */
export async function createConfirmedUser(params: SignUpParams): Promise<AuthUser> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured on the backend')
  }

  const { email, password, role, displayName } = params

  // 1. Create auto-confirmed user via Supabase Auth Admin API
  const adminUrl = `${env.supabaseUrl}/auth/v1/admin/users`
  const res = await fetch(adminUrl, {
    method: 'POST',
    headers: {
      apikey: env.supabaseServiceKey,
      Authorization: `Bearer ${env.supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        display_name: displayName,
        onboarding_completed: false,
      },
    }),
  })

  const userData = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      userData.message ||
      userData.msg ||
      userData.error_description ||
      userData.error ||
      (userData.hint ? `${userData.message || 'Auth error'}: ${userData.hint}` : '') ||
      'Failed to create user'
    console.error('[auth.service] Admin user creation failed:', res.status, msg)
    throw new Error(msg)
  }

  const userId = userData.id

  // 2. Insert into public.profiles
  const profileRes = await fetch(`${env.supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: env.supabaseServiceKey,
      Authorization: `Bearer ${env.supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      id: userId,
      role,
      display_name: displayName,
    }),
  })

  if (!profileRes.ok) {
    const errData = await profileRes.json().catch(() => ({}))
    console.warn('[auth.service] Profile insert note:', errData)
  }

  // 3. If student, initialize clean student_profile skeleton (no hardcoded fake data)
  if (role === 'student') {
    await fetch(`${env.supabaseUrl}/rest/v1/student_profiles`, {
      method: 'POST',
      headers: {
        apikey: env.supabaseServiceKey,
        Authorization: `Bearer ${env.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        branch: '',
        year: '',
        college: '',
        cgpa: 0.0,
        academic_interests: [],
        career_interests: [],
        current_goal: '',
      }),
    }).catch(() => {})
  }

  return {
    id: userId,
    email,
    role,
    displayName,
  }
}

/**
 * Searches for a student by email and initiates a parent-student link with status 'pending'
 */
export async function requestParentStudentLink(parentId: string, studentEmail: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured on the backend')
  }

  const cleanEmail = studentEmail.trim().toLowerCase()

  // 1. Find the student by email using Admin API
  const adminRes = await fetch(`${env.supabaseUrl}/auth/v1/admin/users?per_page=100`, {
    headers: {
      apikey: env.supabaseServiceKey,
      Authorization: `Bearer ${env.supabaseServiceKey}`,
    },
  })

  if (!adminRes.ok) {
    throw new Error('Failed to search student accounts')
  }

  const { users } = (await adminRes.json()) as { users: Array<{ id: string; email: string; user_metadata?: Record<string, unknown> }> }
  const student = users?.find((u) => u.email?.toLowerCase() === cleanEmail)

  if (!student) {
    return {
      success: false,
      error: `No student account found with email "${studentEmail}". Please ask your student to register on EduMitra first.`,
    }
  }

  if (student.user_metadata?.role === 'parent') {
    return {
      success: false,
      error: `The account "${studentEmail}" is registered as a Parent account, not a Student account.`,
    }
  }

  const studentDisplayName =
    (student.user_metadata?.display_name as string) ||
    student.email?.split('@')[0] ||
    'Student'

  // 2. Check if a link already exists
  const linkCheckRes = await fetch(
    `${env.supabaseUrl}/rest/v1/parent_student_links?parent_id=eq.${parentId}&student_id=eq.${student.id}&select=id,status`,
    {
      headers: {
        apikey: env.supabaseServiceKey,
        Authorization: `Bearer ${env.supabaseServiceKey}`,
      },
    },
  )

  const existing = await linkCheckRes.json()
  if (Array.isArray(existing) && existing.length > 0) {
    return {
      success: true,
      status: existing[0].status,
      linkId: existing[0].id,
      studentName: studentDisplayName,
      studentEmail: student.email,
    }
  }

  // 3. Insert new link with pending status
  const insertRes = await fetch(`${env.supabaseUrl}/rest/v1/parent_student_links`, {
    method: 'POST',
    headers: {
      apikey: env.supabaseServiceKey,
      Authorization: `Bearer ${env.supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      parent_id: parentId,
      student_id: student.id,
      status: 'pending',
    }),
  })

  if (!insertRes.ok) {
    const errData = await insertRes.json().catch(() => ({}))
    throw new Error(errData.message || 'Failed to create parent-student link')
  }

  const inserted = await insertRes.json()
  return {
    success: true,
    status: 'pending',
    linkId: inserted[0]?.id,
    studentName: studentDisplayName,
    studentEmail: student.email,
  }
}

/**
 * Retrieves the linked student for a parent (and loads their profile if approved)
 */
export async function getLinkedStudentForParent(parentId: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured on the backend')
  }

  // Query parent_student_links for this parent
  const linksRes = await fetch(
    `${env.supabaseUrl}/rest/v1/parent_student_links?parent_id=eq.${parentId}&order=created_at.desc&select=id,student_id,status,created_at`,
    {
      headers: {
        apikey: env.supabaseServiceKey,
        Authorization: `Bearer ${env.supabaseServiceKey}`,
      },
    },
  )

  if (!linksRes.ok) {
    return { linked: false }
  }

  const links = await linksRes.json()
  if (!Array.isArray(links) || links.length === 0) {
    return { linked: false }
  }

  // Prioritize approved link, or first link
  const link = links.find((l: { status: string }) => l.status === 'approved') || links[0]

  // If link is not approved, do not expose student academic details
  if (link.status !== 'approved') {
    return {
      linked: true,
      linkId: link.id,
      status: link.status,
    }
  }

  // Fetch student profile, user metadata, academic records, and shared goals
  const [profileRes, stProfileRes, adminRes, recordsRes, goalsRes] = await Promise.all([
    fetch(`${env.supabaseUrl}/rest/v1/profiles?id=eq.${link.student_id}&select=display_name`, {
      headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}` },
    }),
    fetch(`${env.supabaseUrl}/rest/v1/student_profiles?user_id=eq.${link.student_id}&select=*`, {
      headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}` },
    }),
    fetch(`${env.supabaseUrl}/auth/v1/admin/users/${link.student_id}`, {
      headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}` },
    }),
    fetch(`${env.supabaseUrl}/rest/v1/academic_records?student_id=eq.${link.student_id}&order=semester.asc`, {
      headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}` },
    }),
    fetch(`${env.supabaseUrl}/rest/v1/goals?student_id=eq.${link.student_id}&shared=eq.true&order=created_at.desc`, {
      headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}` },
    }),
  ])

  const profiles = await profileRes.json().catch(() => [])
  const stProfiles = await stProfileRes.json().catch(() => [])
  const studentUser = await adminRes.json().catch(() => null)
  const rawRecords = await recordsRes.json().catch(() => [])
  const rawGoals = await goalsRes.json().catch(() => [])

  const displayName =
    profiles[0]?.display_name ||
    studentUser?.user_metadata?.display_name ||
    studentUser?.email?.split('@')[0] ||
    'Student'

  const st = stProfiles[0] || {}
  const ob = (studentUser?.user_metadata?.onboarding_data as Record<string, any>) || {}

  const college = st.college || ob.college || ''
  const branch = st.branch || ob.branch || ''
  const year = st.year || ob.year || ''
  const semester =
    ob.semester ||
    (st.year && st.year.includes('Semester') ? st.year.match(/Semester\s*\d+/i)?.[0] : '') ||
    ''
  const cgpa = Number(st.cgpa) || Number(ob.cgpa) || 0

  const strongSubjects: string[] =
    Array.isArray(ob.strongSubjects) && ob.strongSubjects.length > 0
      ? ob.strongSubjects
      : Array.isArray(st.academic_interests)
        ? st.academic_interests
        : []

  const weakSubjects: string[] = Array.isArray(ob.weakSubjects) ? ob.weakSubjects : []

  const academicInterests: string[] =
    Array.isArray(st.academic_interests) && st.academic_interests.length > 0
      ? st.academic_interests
      : strongSubjects

  const careerInterests: string[] =
    Array.isArray(st.career_interests) && st.career_interests.length > 0
      ? st.career_interests
      : Array.isArray(ob.careerGoals)
        ? ob.careerGoals
        : []

  const currentGoal =
    st.current_goal ||
    (Array.isArray(ob.careerGoals) && ob.careerGoals[0]
      ? `Master ${ob.careerGoals[0]} & maintain strong academics`
      : 'Engineering Academic Journey')

  const preferredLearning = st.preferred_learning || ob.preferredLearning || ''

  const records = Array.isArray(rawRecords)
    ? rawRecords.map((r: any) => ({
        id: r.id,
        semester: Number(r.semester),
        subject: r.subject,
        marks: Number(r.marks),
        grade: r.grade,
      }))
    : []

  const goals = Array.isArray(rawGoals)
    ? rawGoals.map((g: any) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        status: g.status,
        progress: Number(g.progress) || 0,
        deadline: g.deadline,
        shared: Boolean(g.shared),
      }))
    : []

  return {
    linked: true,
    linkId: link.id,
    status: link.status,
    student: {
      id: link.student_id,
      displayName,
      email: studentUser?.email || '',
      branch,
      year,
      semester,
      college,
      cgpa,
      academicInterests,
      careerInterests,
      strongSubjects,
      weakSubjects,
      currentGoal,
      preferredLearning,
      records,
      goals,
    },
  }
}

/**
 * Retrieves all parent link requests for a student
 */
export async function getStudentParentLinks(studentId: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured on the backend')
  }

  const linksRes = await fetch(
    `${env.supabaseUrl}/rest/v1/parent_student_links?student_id=eq.${studentId}&order=created_at.desc&select=id,parent_id,status,created_at`,
    {
      headers: {
        apikey: env.supabaseServiceKey,
        Authorization: `Bearer ${env.supabaseServiceKey}`,
      },
    },
  )

  if (!linksRes.ok) return { links: [] }

  const links = (await linksRes.json()) as Array<{ id: string; parent_id: string; status: string; created_at: string }>
  if (!Array.isArray(links)) return { links: [] }

  const enriched = await Promise.all(
    links.map(async (l) => {
      const [profRes, adminRes] = await Promise.all([
        fetch(`${env.supabaseUrl}/rest/v1/profiles?id=eq.${l.parent_id}&select=display_name`, {
          headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}` },
        }),
        fetch(`${env.supabaseUrl}/auth/v1/admin/users/${l.parent_id}`, {
          headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}` },
        }),
      ])
      const prof = await profRes.json().catch(() => [])
      const parentUser = await adminRes.json().catch(() => null)
      return {
        id: l.id,
        parentId: l.parent_id,
        status: l.status,
        createdAt: l.created_at,
        parentName: prof[0]?.display_name || parentUser?.user_metadata?.display_name || 'Parent',
        parentEmail: parentUser?.email || '',
      }
    }),
  )

  return { links: enriched }
}

/**
 * Updates link status (approve or revoke)
 */
export async function respondToParentLink(studentId: string, linkId: string, action: 'approved' | 'revoked') {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured on the backend')
  }

  const res = await fetch(
    `${env.supabaseUrl}/rest/v1/parent_student_links?id=eq.${linkId}&student_id=eq.${studentId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: env.supabaseServiceKey,
        Authorization: `Bearer ${env.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ status: action }),
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update link status')
  }

  return { success: true, status: action }
}
