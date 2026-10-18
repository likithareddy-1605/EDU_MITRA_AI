import { useContext } from 'react'
import { FamilyDecisionContext } from '@/contexts/FamilyDecisionContext'

export function useFamilyDecision() {
  const ctx = useContext(FamilyDecisionContext)
  if (!ctx) throw new Error('useFamilyDecision must be used inside FamilyDecisionProvider')
  return ctx
}
