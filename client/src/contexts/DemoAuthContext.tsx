// Provider component only — hook is in useDemoAuth.ts to satisfy HMR/fast-refresh rules.
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AppUser, UserRole } from '@/types'

// IMPORTANT: This is NOT real authentication.  It is an explicitly labelled
// demo role selector so judges can view both dashboards.  Real Supabase Auth
// + Row Level Security is added in Milestone 2.
const STORAGE_KEY = 'edumitra.demoAuth'

interface DemoAuthState {
  user: AppUser | null
  isDemoMode: true
  signInAs: (role: UserRole, displayName?: string) => void
  signOut: () => void
}

// eslint-disable-next-line react-refresh/only-export-components -- intentional context export
export const DemoAuthContext = createContext<DemoAuthState | undefined>(undefined)

const defaultNames: Record<UserRole, string> = {
  student: 'Aarav Sharma',
  parent: 'Mr. & Mrs. Sharma',
  admin: 'Administrator',
}

function readStored(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AppUser) : null
  } catch {
    return null
  }
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(readStored)

  const signInAs = useCallback((role: UserRole, displayName?: string) => {
    const next: AppUser = { id: `demo-${role}`, role, displayName: displayName ?? defaultNames[role] }
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo<DemoAuthState>(
    () => ({ user, isDemoMode: true, signInAs, signOut }),
    [user, signInAs, signOut],
  )

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>
}
