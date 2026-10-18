import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useDemoAuth } from '@/hooks/useDemoAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RoadmapPage } from '@/pages/RoadmapPage'
import { AcademicsPage } from '@/features/academics/AcademicsPage'
import { GoalsPage } from '@/features/goals/GoalsPage'
import { ParentDashboard } from '@/features/parent-dashboard/ParentDashboard'
import { ProfilePage } from '@/features/student-profile/ProfilePage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { StudentDashboard } from '@/features/student-dashboard/StudentDashboard'
import { StudyPlannerPage } from '@/features/study-planner/StudyPlannerPage'
import { CourseAdvisorPage } from '@/features/course-advisor/CourseAdvisorPage'
import { AcademicAdvisorPage } from '@/features/academic-advisor/AcademicAdvisorPage'
import { CareerPage } from '@/features/career/CareerPage'
import { FamilyDecisionsPage } from '@/features/family-decisions/FamilyDecisionsPage'
import { WellbeingPage } from '@/features/wellbeing/WellbeingPage'
import { ResourcesPage } from '@/features/resources/ResourcesPage'
import { StudentSettingsPage } from '@/features/settings/StudentSettingsPage'
import { ParentAcademicsPage } from '@/features/parent-dashboard/ParentAcademicsPage'
import { ParentGoalsPage } from '@/features/parent-dashboard/ParentGoalsPage'
import { ParentSupportPage } from '@/features/parent-dashboard/ParentSupportPage'
import { ParentSettingsPage } from '@/features/parent-dashboard/ParentSettingsPage'

/** Guards a role area: redirects to the demo landing if no role is chosen. */
function RoleRoute({ allow, children }: { allow: 'student' | 'parent'; children: ReactNode }) {
  const { user } = useDemoAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role !== allow) return <Navigate to={user.role === 'parent' ? '/parent' : '/student'} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/student" element={<RoleRoute allow="student"><AppLayout /></RoleRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="academics" element={<AcademicsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="study-planner" element={<StudyPlannerPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="advisor" element={<AcademicAdvisorPage />} />
          <Route path="career" element={<CareerPage />} />
          <Route path="decisions" element={<FamilyDecisionsPage />} />
          <Route path="wellbeing" element={<WellbeingPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
          <Route path=":feature" element={<RoadmapPage />} />
        </Route>

        <Route path="/parent" element={<RoleRoute allow="parent"><AppLayout /></RoleRoute>}>
          <Route index element={<ParentDashboard />} />
          <Route path="academic-summary" element={<ParentAcademicsPage />} />
          <Route path="goals" element={<ParentGoalsPage />} />
          <Route path="support" element={<ParentSupportPage />} />
          <Route path="action-plan" element={<ParentSupportPage />} />
          <Route path="course-advisor" element={<CourseAdvisorPage />} />
          <Route path="career" element={<CareerPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="wellbeing" element={<WellbeingPage />} />
          <Route path="decisions" element={<FamilyDecisionsPage />} />
          <Route path="settings" element={<ParentSettingsPage />} />
          <Route path=":feature" element={<RoadmapPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
