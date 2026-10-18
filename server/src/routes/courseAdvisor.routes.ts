import { Router } from 'express'
import { explainRecommendations, type ExplainRequest } from '../services/courseAdvisor.service'

const router = Router()

// POST /api/course-advisor/explain
// Returns { source: 'ai' | 'fallback', summary }.
// When Gemini is not configured (or fails), returns a clearly-labelled
// rule-based fallback instead of erroring — so the demo always works.
router.post('/course-advisor/explain', (req, res) => {
  const body = req.body as Partial<ExplainRequest>
  if (!body?.assessment || !Array.isArray(body.topBranches)) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }
  explainRecommendations(body as ExplainRequest)
    .then((result) => res.json(result))
    .catch(() => res.status(500).json({ error: 'Failed to generate summary' }))
})

export default router
