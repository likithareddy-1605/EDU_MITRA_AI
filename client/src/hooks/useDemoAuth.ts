import { useContext } from 'react'
import { DemoAuthContext } from '@/contexts/DemoAuthContext'

export function useDemoAuth() {
  const ctx = useContext(DemoAuthContext)
  if (!ctx) throw new Error('useDemoAuth must be used within a DemoAuthProvider')
  return ctx
}
