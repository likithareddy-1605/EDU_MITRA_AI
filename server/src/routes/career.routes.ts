import { Router } from 'express'
import { getCareerGuidance, type CareerGuidanceContext } from '../services/careerGuidance.service'

const router = Router()

// POST /api/career/guidance -> CareerGuidanceResult
router.post('/career/guidance', async (req, res) => {
  try {
    const ctx = req.body as Partial<CareerGuidanceContext>
    if (!ctx?.studentName || !ctx?.branch) {
      res.status(400).json({ error: 'Missing required student context (studentName, branch)' })
      return
    }
    const result = await getCareerGuidance(ctx as CareerGuidanceContext)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Failed to generate career guidance' })
  }
})

export default router
