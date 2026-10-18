import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  ArrowRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Compass,
  Flame,
  Lightbulb,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { useFamilyDecision } from '@/hooks/useFamilyDecision'
import { branches } from '@/data/courseAdvisorData'
import {
  fetchStudentParentLinks,
  respondStudentParentLink,
  type StudentParentRequest,
} from '@/services/parentStudentLink'
import {
  bottomSubjects,
  computeCgpa,
  computeSemesterGpas,
  computeStreak,
  computeSubjectAverages,
  computeUpcoming,
  recommendedNextAction,
  readinessEstimate,
  topSubjects,
} from '@/utils/studentStats'
import { formatDate } from '@/utils/format'
import type { BadgeTone } from '@/components/ui/Badge'
import type { Priority } from '@/types'

const priorityTone: Record<Priority, BadgeTone> = {
  high: 'red',
  medium: 'amber',
  low: 'neutral',
}

export function StudentDashboard() {
  const { t } = useLanguage()
  const { user, isDemoMode } = useAuth()
  const { data } = useStudentData()
  const { decision } = useFamilyDecision()
  const { profile, records, goals, tasks, achievements, activities } = data

  const chosenBranch = branches.find((b) => b.id === decision.finalBranchId) ?? null

  const isPlanningStage = !isDemoMode && user?.educationStage === 'planning'

  const cgpa = useMemo(() => {
    const fromRecords = computeCgpa(records)
    if (fromRecords > 0) return fromRecords
    return profile.cgpa || 0
  }, [records, profile.cgpa])

  const semesterGpas = useMemo(() => computeSemesterGpas(records), [records])
  const subjectPerformance = useMemo(() => computeSubjectAverages(records), [records])
  const upcoming = useMemo(() => computeUpcoming(goals, tasks), [goals, tasks])
  const streak = useMemo(() => computeStreak(tasks, activities), [tasks, activities])
  const strengths = useMemo(() => {
    const fromRecords = topSubjects(subjectPerformance, 3)
    if (fromRecords.length > 0) return fromRecords
    return profile.academicInterests.slice(0, 3)
  }, [subjectPerformance, profile.academicInterests])
  const improvement = useMemo(() => bottomSubjects(subjectPerformance, 3), [subjectPerformance])
  const recommended = useMemo(() => recommendedNextAction(goals, tasks), [goals, tasks])
  const readiness = useMemo(() => readinessEstimate(profile, goals), [profile, goals])
  const activeGoals = goals.filter((g) => g.status !== 'completed').length

  // Parent link requests (real student mode only)
  const [parentRequests, setParentRequests] = useState<StudentParentRequest[]>([])

  const loadParentRequests = useCallback(async () => {
    if (isDemoMode || !user?.id) return
    const reqs = await fetchStudentParentLinks(user.id)
    setParentRequests(reqs.filter((r) => r.status === 'pending'))
  }, [isDemoMode, user?.id])

  useEffect(() => {
    loadParentRequests()
  }, [loadParentRequests])

  const handleRespondParent = async (linkId: string, action: 'approved' | 'revoked') => {
    if (!user?.id) return
    const ok = await respondStudentParentLink(user.id, linkId, action)
    if (ok) {
      setParentRequests((prev) => prev.filter((r) => r.id !== linkId))
    }
  }

  return (
    <div>
      <PageHeader
        title={`${t('student.welcome')}, ${user?.displayName ?? profile.displayName}`}
        subtitle={profile.currentGoal}
        actions={
          isDemoMode ? (
            <Badge tone="amber">{t('demo.label')}</Badge>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={13} className="text-emerald-600" aria-hidden />
              {isPlanningStage ? 'Verified Aspirant' : 'Verified Student'}
            </span>
          )
        }
      />

      {/* Pending Parent Access Request Notification Banner */}
      {!isDemoMode && parentRequests.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50/80 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Users size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Parent Access Request</h3>
                <p className="mt-0.5 text-xs text-ink-muted">
                  <strong>{parentRequests[0].parentName}</strong> ({parentRequests[0].parentEmail}) has requested permission to view your academic summary and shared goals.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRespondParent(parentRequests[0].id, 'approved')}
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                Approve Access
              </button>
              <button
                type="button"
                onClick={() => handleRespondParent(parentRequests[0].id, 'revoked')}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-muted hover:bg-slate-50 transition"
              >
                Decline
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Engineering Aspirant Banner */}
      {isPlanningStage && (
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Compass size={20} aria-hidden />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink">Planning to Join Engineering</h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                    {profile.year || 'Aspirant'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Preferred Branches: <strong className="text-ink">{profile.branch || 'Exploring Branches'}</strong> • Target: {profile.currentGoal}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/student/course-advisor"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Branch Advisor <ArrowRight size={13} />
              </Link>
              <Link
                to="/student/decisions"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
              >
                Family Decision
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Recommended next action (A12 — personal insights) */}
      <Card className="mb-6 border-blue-200 bg-blue-50/60">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Lightbulb size={18} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {t('student.recommendedNext')}
            </p>
            <p className="mt-1 text-sm text-ink">{recommended}</p>
          </div>
        </div>
      </Card>

      {/* Stat cards (A2/A6/A10) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={t('student.stats.cgpa')}
          value={cgpa.toFixed(2)}
          tone="blue"
          icon={<TrendingUp size={20} aria-hidden />}
          hint={profile.year}
        />
        <StatCard label={t('student.stats.goals')} value={activeGoals} tone="teal" icon={<Target size={20} aria-hidden />} />
        <StatCard
          label={t('student.stats.streak')}
          value={streak}
          unit={t('student.daysUnit')}
          tone="amber"
          icon={<Flame size={20} aria-hidden />}
        />
        <StatCard label={t('student.stats.readiness')} value={`${readiness}%`} tone="green" icon={<Award size={20} aria-hidden />} />
      </div>

      {/* CGPA trend (A11) + Upcoming activities */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">{t('student.cgpaTrend')}</h2>
          {semesterGpas.length > 0 ? (
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={semesterGpas} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="sgpa" name="SGPA" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-subtle">{t('academics.empty')}</p>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">{t('student.upcoming')}</h2>
          {upcoming.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 text-slate-400">
                    <CalendarClock size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                    <p className="text-xs text-ink-subtle">{formatDate(a.due)}</p>
                  </div>
                  <Badge tone={priorityTone[a.priority]}>{a.priority}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-subtle">{t('common.none')}</p>
          )}
        </Card>
      </div>

      {/* Active goals (A4) + Strengths & improvement (A3) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">{t('student.activeGoals')}</h2>
            <Link
              to="/student/goals"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {t('common.viewAll')}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          {goals.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {goals.map((g) => (
                <li key={g.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{g.title}</p>
                    <span className="text-xs text-ink-subtle">{g.progress}%</span>
                  </div>
                  <ProgressBar
                    className="mt-2"
                    value={g.progress}
                    tone={g.status === 'completed' ? 'green' : g.status === 'not_started' ? 'amber' : 'teal'}
                  />
                  {g.deadline ? <p className="mt-1 text-xs text-ink-subtle">{formatDate(g.deadline)}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-subtle">{t('goals.empty')}</p>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">{t('student.strongSubjects')}</h2>
          <ul className="mt-3 space-y-2">
            {strengths.length ? (
              strengths.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 size={16} className="text-emerald-600" aria-hidden /> {s}
                </li>
              ))
            ) : (
              <li className="text-sm text-ink-subtle">—</li>
            )}
          </ul>
          <h2 className="mt-5 text-base font-semibold text-ink">{t('student.improvementAreas')}</h2>
          <ul className="mt-3 space-y-2">
            {improvement.length ? (
              improvement.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-ink">
                  <AlertCircle size={16} className="text-amber-600" aria-hidden /> {s}
                </li>
              ))
            ) : (
              <li className="text-sm text-ink-subtle">—</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Subject performance (A3) + Achievements (A9) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">{t('student.subjectPerformance')}</h2>
          {subjectPerformance.length > 0 ? (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} layout="vertical" margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="subject" width={90} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="averageMarks" name="Avg marks" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-subtle">{t('academics.empty')}</p>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">{t('student.achievements')}</h2>
          {achievements.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber-600">
                    <Trophy size={16} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.title}</p>
                    <p className="text-xs text-ink-subtle">{formatDate(a.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-subtle">{t('progress.empty')}</p>
          )}
        </Card>
      </div>

      {/* Family Decision Comparison entry card */}
      <Card className="mt-6 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50" padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
              <Users size={22} aria-hidden />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{t('decision.title')}</h2>
                <Badge tone={decision.savedAt ? 'teal' : 'amber'}>
                  {decision.savedAt ? t('decision.dashboard.statusSaved') : t('decision.dashboard.statusPending')}
                </Badge>
              </div>
              <p className="mt-1 max-w-xl text-sm text-ink-muted">
                {decision.savedAt && chosenBranch
                  ? `${t('decision.record.chosenBranch')}: ${chosenBranch.name} • ${t('decision.record.savedAt')}: ${formatDate(decision.savedAt.slice(0, 10))}`
                  : t('decision.subtitle')}
              </p>
            </div>
          </div>
          <Link
            to="/student/decisions"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            {decision.savedAt ? t('decision.dashboard.review') : t('decision.dashboard.compare')}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </Card>
    </div>
  )
}
