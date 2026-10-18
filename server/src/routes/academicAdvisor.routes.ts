import { Router } from 'express'
import { answerQuestion, summarizeProgress, type AdvisorContext } from '../services/academicAdvisor.service'

const router = Router()

// POST /api/academic-advisor/summary  -> { source, text }
router.post('/academic-advisor/summary', (req, res) => {
  const ctx = req.body as Partial<AdvisorContext>
  if (!ctx?.profile) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }
  summarizeProgress(ctx as AdvisorContext)
    .then((r) => res.json(r))
    .catch(() => res.status(500).json({ error: 'Failed to generate summary' }))
})

// POST /api/academic-advisor/ask  -> { source, text }
router.post('/academic-advisor/ask', (req, res) => {
  const body = req.body as { context?: AdvisorContext; question?: string }
  if (!body?.context?.profile || !body.question?.trim()) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }
  answerQuestion(body.context, body.question.trim())
    .then((r) => res.json(r))
    .catch(() => res.status(500).json({ error: 'Failed to answer' }))
})

export default router
