import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes'
import courseAdvisorRoutes from './routes/courseAdvisor.routes'
import academicAdvisorRoutes from './routes/academicAdvisor.routes'
import careerRoutes from './routes/career.routes'
import authRoutes from './routes/auth.routes'
import { errorHandler } from './middleware/error.middleware'
import { env } from './utils/env'

const app = express()

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        !env.clientOrigin ||
        env.clientOrigin === '*' ||
        origin === env.clientOrigin ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  }),
)
app.use(express.json())

// --- Routes -----------------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({ name: 'EduMitra AI API', version: '0.1.0' })
})

app.use('/api', healthRoutes, courseAdvisorRoutes, academicAdvisorRoutes, careerRoutes, authRoutes)

// --- 404 + error handling ---------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(errorHandler)

// --- Start (Local dev) -----------------------------------------------------
if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`EduMitra API listening on http://localhost:${env.port} [${env.nodeEnv}]`)
  })
}

export default app
