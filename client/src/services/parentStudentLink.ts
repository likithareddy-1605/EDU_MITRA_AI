const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

export interface LinkedStudentSummary {
  id: string
  displayName: string
  email: string
  branch: string
  year: string
  semester?: string
  college: string
  cgpa: number
  academicInterests: string[]
  careerInterests: string[]
  strongSubjects?: string[]
  weakSubjects?: string[]
  currentGoal: string
  preferredLearning: string
  records?: Array<{
    id: string
    semester: number
    subject: string
    marks: number
    grade: string
  }>
  goals?: Array<{
    id: string
    title: string
    category: any
    status: any
    progress: number
    deadline?: string
    shared: boolean
  }>
}

export interface ParentLinkStatus {
  linked: boolean
  linkId?: string
  status?: 'pending' | 'approved' | 'revoked'
  student?: LinkedStudentSummary
  error?: string
}

export interface StudentParentRequest {
  id: string
  parentId: string
  parentName: string
  parentEmail: string
  status: 'pending' | 'approved' | 'revoked'
  createdAt: string
}

/**
 * Initiates linking request from a parent to a student by student's email.
 */
export async function requestParentLink(
  parentId: string,
  studentEmail: string,
): Promise<{ success: boolean; status?: string; linkId?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/parent/link-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, studentEmail: studentEmail.trim().toLowerCase() }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to request student link' }
    }
    return { success: true, status: data.status, linkId: data.linkId }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

/**
 * Fetches the linked student information for a parent account.
 */
export async function fetchParentLinkedStudent(parentId: string): Promise<ParentLinkStatus> {
  try {
    const res = await fetch(`${API_BASE}/auth/parent/linked-student?parentId=${encodeURIComponent(parentId)}`)
    if (!res.ok) {
      return { linked: false }
    }
    const data = await res.json()
    return data as ParentLinkStatus
  } catch {
    return { linked: false }
  }
}

/**
 * Fetches all parent access requests for a student.
 */
export async function fetchStudentParentLinks(studentId: string): Promise<StudentParentRequest[]> {
  try {
    const res = await fetch(`${API_BASE}/auth/student/parent-links?studentId=${encodeURIComponent(studentId)}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.links as StudentParentRequest[]) || []
  } catch {
    return []
  }
}

/**
 * Student approves or revokes a parent link request.
 */
export async function respondStudentParentLink(
  studentId: string,
  linkId: string,
  action: 'approved' | 'revoked',
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/student/parent-links/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, linkId, action }),
    })
    return res.ok
  } catch {
    return false
  }
}
