import dotenv from 'dotenv'

// Load environment variables from server/.env (if present).
dotenv.config()

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // CORS origin for the frontend (Vite dev server by default).
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // AI provider config is OPTIONAL in Milestone 1. When GEMINI_API_KEY is
  // absent, the AI service (added in Milestone 3) must return a clearly
  // labelled deterministic fallback rather than failing.
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  // Supabase service credentials are OPTIONAL until Milestone 2.
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

export const isAiConfigured = Boolean(env.geminiApiKey)
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseServiceKey)
