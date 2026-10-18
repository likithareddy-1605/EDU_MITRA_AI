import { useContext } from 'react'
import { StudentDataContext } from '@/contexts/StudentDataContext'

export function useStudentData() {
  const ctx = useContext(StudentDataContext)
  if (!ctx) throw new Error('useStudentData must be used within a StudentDataProvider')
  return ctx
}
