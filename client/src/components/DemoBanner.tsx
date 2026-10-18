import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Only shown when explicitly browsing in offline demo mode.
 * Completely hidden during real authenticated Supabase sessions.
 */
export function DemoBanner() {
  const { isDemoMode } = useAuth()

  if (!isDemoMode) return null

  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800">
      <AlertTriangle size={14} className="shrink-0" aria-hidden />
      <p>Offline Demo Preview — Sign in to synchronize your profile and records with Supabase.</p>
    </div>
  )
}
