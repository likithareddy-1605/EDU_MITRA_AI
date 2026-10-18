// Context for the Family Decision Comparison module (Module E).
// Follows the same localStorage-persistence pattern as StudentDataContext.
// In production this would sync with a Supabase row.

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { emptyFamilyDecision, type FamilyDecision } from '@/types'

const STORAGE_KEY = 'edumitra.familyDecision'

function load(): FamilyDecision {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as FamilyDecision
  } catch {
    /* ignore malformed storage */
  }
  return { ...emptyFamilyDecision }
}

export interface FamilyDecisionApi {
  decision: FamilyDecision
  updateDecision: (patch: Partial<FamilyDecision>) => void
  resetDecision: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const FamilyDecisionContext = createContext<FamilyDecisionApi | undefined>(undefined)

export function FamilyDecisionProvider({ children }: { children: ReactNode }) {
  const [decision, setDecision] = useState<FamilyDecision>(load)

  // Persist every change to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decision))
    } catch {
      /* storage full or blocked */
    }
  }, [decision])

  const updateDecision = useCallback((patch: Partial<FamilyDecision>) => {
    setDecision((d) => ({ ...d, ...patch }))
  }, [])

  const resetDecision = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setDecision({ ...emptyFamilyDecision })
  }, [])

  const value = useMemo<FamilyDecisionApi>(
    () => ({ decision, updateDecision, resetDecision }),
    [decision, updateDecision, resetDecision],
  )

  return <FamilyDecisionContext.Provider value={value}>{children}</FamilyDecisionContext.Provider>
}
