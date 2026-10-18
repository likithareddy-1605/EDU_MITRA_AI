import dotenv from 'dotenv'
import path from 'path'

// Load root .env file across all working directory scenarios:
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })
dotenv.config() // also check default location

function cleanEnv(val: string | undefined): string {
  if (!val) return ''
  return val.trim().replace(/^["']|["']$/g, '').trim()
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // CORS origin for the frontend (Vite dev server by default).
  clientOrigin: cleanEnv(process.env.CLIENT_ORIGIN) || 'http://localhost:5173',
  // AI provider config is OPTIONAL in Milestone 1. When GEMINI_API_KEY is
  // absent, the AI service (added in Milestone 3) must return a clearly
  // labelled deterministic fallback rather than failing.
  geminiApiKey: cleanEnv(process.env.GEMINI_API_KEY),
  // Supabase service credentials are OPTIONAL until Milestone 2.
  supabaseUrl: cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/$/, ''),
  supabaseServiceKey: cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  ),
}

export const isAiConfigured = Boolean(env.geminiApiKey)
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseServiceKey)
