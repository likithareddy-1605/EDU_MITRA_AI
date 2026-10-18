import { Router } from 'express'
import { isAiConfigured, isSupabaseConfigured } from '../utils/env'

const router = Router()

/**
 * Liveness + configuration probe. The endpoint is deliberately honest about
 * what is and isn't configured, so the frontend (and judges) can tell whether
 * live AI / database are available or whether the app is running in fallback
 * mode.
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'edumitra-api',
    time: new Date().toISOString(),
    configuration: {
      ai: isAiConfigured ? 'configured' : 'not-configured',
      database: isSupabaseConfigured ? 'configured' : 'not-configured',
    },
  })
})

export default router
