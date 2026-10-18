import { Router } from 'express'
import {
  createConfirmedUser,
  getLinkedStudentForParent,
  getStudentParentLinks,
  requestParentStudentLink,
  respondToParentLink,
} from '../services/auth.service'

const router = Router()

// POST /api/auth/signup -> { user }
router.post('/auth/signup', async (req, res) => {
  const { email, password, role, displayName } = req.body || {}

  if (!email || !password || !role) {
    res.status(400).json({ error: 'Email, password, and role are required' })
    return
  }

  if (role !== 'student' && role !== 'parent') {
    res.status(400).json({ error: 'Role must be student or parent' })
    return
  }

  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  try {
    const user = await createConfirmedUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      role,
      displayName: displayName ? String(displayName).trim() : (role === 'student' ? 'Student' : 'Parent'),
    })
    res.status(201).json({ user })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signup failed'
    console.error('[auth.routes] Signup error:', msg)
    res.status(400).json({ error: msg })
  }
})

// POST /api/auth/parent/link-student -> initiate link with student
router.post('/auth/parent/link-student', async (req, res) => {
  const { parentId, studentEmail } = req.body || {}

  if (!parentId || !studentEmail) {
    res.status(400).json({ error: 'parentId and studentEmail are required' })
    return
  }

  try {
    const result = await requestParentStudentLink(parentId, studentEmail)
    if (!result.success) {
      res.status(404).json({ error: result.error })
      return
    }
    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to link student'
    res.status(500).json({ error: msg })
  }
})

// GET /api/auth/parent/linked-student -> get student info for parent
router.get('/auth/parent/linked-student', async (req, res) => {
  const parentId = req.query.parentId as string

  if (!parentId) {
    res.status(400).json({ error: 'parentId query parameter is required' })
    return
  }

  try {
    const result = await getLinkedStudentForParent(parentId)
    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch linked student'
    res.status(500).json({ error: msg })
  }
})

// GET /api/auth/student/parent-links -> get link requests for student
router.get('/auth/student/parent-links', async (req, res) => {
  const studentId = req.query.studentId as string

  if (!studentId) {
    res.status(400).json({ error: 'studentId query parameter is required' })
    return
  }

  try {
    const result = await getStudentParentLinks(studentId)
    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch parent links'
    res.status(500).json({ error: msg })
  }
})

// POST /api/auth/student/parent-links/respond -> approve or revoke
router.post('/auth/student/parent-links/respond', async (req, res) => {
  const { studentId, linkId, action } = req.body || {}

  if (!studentId || !linkId || !action || (action !== 'approved' && action !== 'revoked')) {
    res.status(400).json({ error: 'studentId, linkId, and action ("approved" | "revoked") are required' })
    return
  }

  try {
    const result = await respondToParentLink(studentId, linkId, action)
    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update link status'
    res.status(500).json({ error: msg })
  }
})

export default router
