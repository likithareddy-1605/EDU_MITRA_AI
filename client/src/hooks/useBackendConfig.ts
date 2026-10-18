/**
 * Fetches /api/health once per session to check whether the backend has
 * real Gemini AI and Supabase credentials configured.
 * Used to show/hide demo mode banners accurately.
 */
import { useEffect, useState } from 'react'

export interface BackendConfig {
  isAiConfigured: boolean
  isDbConfigured: boolean
  checked: boolean
}

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

let _cache: BackendConfig | null = null
let _promise: Promise<BackendConfig> | null = null

async function fetchConfig(): Promise<BackendConfig> {
  if (_cache) return _cache
  if (!_promise) {
    _promise = fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((data) => {
        const cfg: BackendConfig = {
          isAiConfigured: data?.configuration?.ai === 'configured',
          isDbConfigured: data?.configuration?.database === 'configured',
          checked: true,
        }
        _cache = cfg
        return cfg
      })
      .catch(() => {
        const cfg: BackendConfig = { isAiConfigured: false, isDbConfigured: false, checked: true }
        _cache = cfg
        return cfg
      })
  }
  return _promise
}

export function useBackendConfig(): BackendConfig {
  const [config, setConfig] = useState<BackendConfig>(
    _cache ?? { isAiConfigured: false, isDbConfigured: false, checked: false },
  )

  useEffect(() => {
    if (_cache) {
      setConfig(_cache)
      return
    }
    fetchConfig().then(setConfig)
  }, [])

  return config
}
