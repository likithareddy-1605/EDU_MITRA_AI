import {
  BookOpen,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Compass,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '@/locales/en'

export interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: LucideIcon
  /** `end` matches the index route exactly (React Router NavLink behavior). */
  end?: boolean
}

export const studentNav: NavItem[] = [
  { to: '/student', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/profile', labelKey: 'nav.profile', icon: User },
  { to: '/student/academics', labelKey: 'nav.academics', icon: GraduationCap },
  { to: '/student/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/student/study-planner', labelKey: 'nav.studyPlanner', icon: CalendarDays },
  { to: '/student/progress', labelKey: 'nav.progress', icon: TrendingUp },
  { to: '/student/advisor', labelKey: 'nav.advisor', icon: Sparkles },
  { to: '/student/career', labelKey: 'nav.career', icon: Briefcase },
  { to: '/student/decisions', labelKey: 'nav.decisions', icon: Users },
  { to: '/student/wellbeing', labelKey: 'nav.wellbeing', icon: HeartPulse },
  { to: '/student/resources', labelKey: 'nav.resources', icon: BookOpen },
  { to: '/student/settings', labelKey: 'nav.settings', icon: Settings },
]

export const parentNav: NavItem[] = [
  { to: '/parent', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/parent/academic-summary', labelKey: 'nav.academicSummary', icon: GraduationCap },
  { to: '/parent/goals', labelKey: 'nav.goals', icon: Target },
  { to: '/parent/support', labelKey: 'nav.support', icon: LifeBuoy },
  { to: '/parent/action-plan', labelKey: 'nav.actionPlan', icon: ClipboardList },
  { to: '/parent/course-advisor', labelKey: 'nav.courseAdvisor', icon: Compass },
  { to: '/parent/career', labelKey: 'nav.career', icon: Briefcase },
  { to: '/parent/resources', labelKey: 'nav.resources', icon: BookOpen },
  { to: '/parent/wellbeing', labelKey: 'nav.wellbeing', icon: HeartPulse },
  { to: '/parent/decisions', labelKey: 'nav.decisions', icon: Users },
  { to: '/parent/settings', labelKey: 'nav.settings', icon: Settings },
]
