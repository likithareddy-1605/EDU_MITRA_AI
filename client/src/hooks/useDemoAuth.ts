import { useAuth } from './useAuth'
import type { UserRole } from '@/types'

export function useDemoAuth() {
  const auth = useAuth()
  return {
    user: auth.user,
    isDemoMode: auth.isDemoMode,
    signInAs: (role: UserRole) => auth.signInAsDemo(role),
    signOut: () => {
      auth.signOut().catch(() => {})
    },
  }
}
