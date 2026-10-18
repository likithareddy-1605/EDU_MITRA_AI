import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  GraduationCap,
  LifeBuoy,
  RefreshCw,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { useFamilyDecision } from '@/hooks/useFamilyDecision'
import { useAuth } from '@/hooks/useAuth'
import { branches } from '@/data/courseAdvisorData'
import {
  fetchParentLinkedStudent,
  requestParentLink,
  type ParentLinkStatus,
} from '@/services/parentStudentLink'
import {
  bottomSubjects,
  computeCgpa,
  computeSemesterGpas,
  computeSubjectAverages,
  topSubjects,
} from '@/utils/studentStats'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import type { ActionItem } from '@/types'

const defaultActionPlan: ActionItem[] = [
  { id: 'ap1', title: 'Finalise internship shortlist by 10 Nov', owner: 'student', status: 'pending' },
  { id: 'ap2', title: 'Review family budget for certification fee', owner: 'family', status: 'pending' },
  { id: 'ap3', title: 'Schedule a 20-minute weekly progress chat', owner: 'family', status: 'done' },
]

const supportSuggestions = [
  {
    id: 's1',
    title: 'Encourage a fixed daily study slot',
    detail: 'A consistent evening study time builds learning streaks and supports steady progress.',
  },
  {
    id: 's2',
    title: 'Discuss the next career or internship goal together',
    detail: 'Talking through options early reduces last-minute pressure before placement season.',
  },
  {
    id: 's3',
    title: 'Recognise improvement, not just final scores',
    detail: 'Noticing upward trends keeps motivation healthy and reduces stress.',
  },
]

export function ParentDashboard() {
  const { t } = useLanguage()
  const { user, isDemoMode } = useAuth()
  const { data, refresh } = useStudentData()
  const { decision } = useFamilyDecision()
  const { profile, records, goals, achievements } = data

  const chosenBranch = branches.find((b) => b.id === decision.finalBranchId) ?? null

  // Link state for real parent mode
  const [linkStatus, setLinkStatus] = useState<ParentLinkStatus | null>(null)
  const [loadingLink, setLoadingLink] = useState(false)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkSubmitting, setLinkSubmitting] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)

  const checkLink = useCallback(async () => {
    if (isDemoMode || !user?.id) return
    setLoadingLink(true)
    const res = await fetchParentLinkedStudent(user.id)
    setLinkStatus(res)
    if (res.linked && res.status === 'approved') {
      await refresh()
    }
    setLoadingLink(false)
  }, [isDemoMode, user?.id, refresh])

  useEffect(() => {
    checkLink()
  }, [checkLink])

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkEmail.trim() || !user?.id) return
    setLinkSubmitting(true)
    setLinkError(null)
    setLinkSuccess(null)
    const res = await requestParentLink(user.id, linkEmail.trim())
    setLinkSubmitting(false)
    if (res.success) {
      setLinkSuccess(`Link request sent to ${linkEmail.trim()}! Awaiting student approval.`)
      setLinkEmail('')
      checkLink()
    } else {
      setLinkError(res.error || 'Failed to send link request')
    }
  }

  // Computed from the linked student's own records or saved CGPA (not hardcoded).
  const computedCgpa = computeCgpa(records)
  const cgpa = computedCgpa > 0 ? computedCgpa : (profile.cgpa || 0)
  const displayCgpa =
    computedCgpa > 0
      ? computedCgpa.toFixed(2)
      : profile.cgpa
        ? Number(profile.cgpa).toFixed(2)
        : null
  const semesterGpas = computeSemesterGpas(records)
  const subjectAverages = computeSubjectAverages(records)
  const strengths =
    profile.strongSubjects && profile.strongSubjects.length > 0
      ? profile.strongSubjects
      : topSubjects(subjectAverages, 3).length > 0
        ? topSubjects(subjectAverages, 3)
        : profile.academicInterests.slice(0, 3)

  const improvement =
    profile.weakSubjects && profile.weakSubjects.length > 0
      ? profile.weakSubjects
      : bottomSubjects(subjectAverages, 2)

  const trend =
    semesterGpas.length >= 2 ? semesterGpas[semesterGpas.length - 1].sgpa - semesterGpas[0].sgpa : 0

  // Permission-respecting: only goals the student has chosen to share.
  const sharedGoals = goals.filter((g) => g.shared)

  // Plain-language summary generated from real data.
  const yearSem = profile.year
    ? `${profile.year}${profile.semester ? ` (${profile.semester})` : ''}`
    : 'Engineering'
  const collegeDisplay = profile.college ? ` at ${profile.college}` : ''

  const summary =
    profile.displayName
      ? `${profile.displayName} is enrolled in ${yearSem} of ${profile.branch || 'Engineering'}${collegeDisplay}.${displayCgpa ? ` Current CGPA is ${displayCgpa}` : ''}` +
        (trend > 0 ? `, up from ${semesterGpas[0].sgpa.toFixed(1)} — a positive trend.` : '.') +
        (strengths.length > 0 ? ` Strongest areas: ${strengths.join(', ')}.` : '') +
        (improvement.length > 0 ? ` Focus areas: ${improvement.join(', ')}.` : '')
      : 'Student records will appear here as they are added by the student.'

  // Interactive family action plan (local demo state).
  const [plan, setPlan] = useState<ActionItem[]>(defaultActionPlan)
  const toggle = (id: string) =>
    setPlan((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: it.status === 'done' ? 'pending' : 'done' } : it)),
    )

  // If running in real parent mode and student link is not approved yet, guard student data
  if (!isDemoMode && (!linkStatus?.linked || linkStatus.status !== 'approved')) {
    return (
      <div>
        <PageHeader
          title={t('parent.welcome')}
          subtitle={
            linkStatus?.status === 'pending'
              ? 'Parent-Student Link Awaiting Approval'
              : 'Connect with your student to view academic progress'
          }
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
              <ShieldCheck size={13} className="text-teal-600" aria-hidden />
              Verified Parent
            </span>
          }
        />

        {/* Privacy Note */}
        <p className="mb-6 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-ink-muted">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
          {t('parent.privacyNote')}
        </p>

        {linkStatus?.status === 'pending' ? (
          <Card className="max-w-2xl border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Clock size={24} />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-ink">Link Request Pending Student Approval</h3>
                  <Badge tone="amber">Pending</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  A linking request has been sent to connect with your student
                  {linkStatus.student?.displayName ? (
                    <strong className="text-ink"> ({linkStatus.student.displayName})</strong>
                  ) : ''}.
                  For student privacy and security, academic records and shared goals will appear here as soon as your student approves the request in their EduMitra dashboard.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={checkLink}
                    disabled={loadingLink}
                    className="gap-2 bg-white"
                  >
                    <RefreshCw size={14} className={loadingLink ? 'animate-spin' : ''} />
                    {loadingLink ? 'Checking...' : 'Refresh Status'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="max-w-2xl border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <Users size={24} />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-ink">Link Your Student's Account</h3>
                <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
                  Enter your student's registered EduMitra email address to request access. Once your student approves, you can view their academic performance, CGPA trajectory, and shared milestones.
                </p>

                <form onSubmit={handleRequestLink} className="mt-5 space-y-3">
                  <Field label="Student's EduMitra Email Address" htmlFor="linkEmail" error={linkError || undefined}>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="linkEmail"
                        type="email"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        placeholder="e.g. student@college.edu"
                        required
                        className="bg-white flex-1"
                      />
                      <Button type="submit" disabled={linkSubmitting} className="shrink-0 gap-1.5 bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto">
                        <Send size={14} />
                        {linkSubmitting ? 'Sending...' : 'Send Request'}
                      </Button>
                    </div>
                  </Field>

                  {linkSuccess && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={14} />
                      {linkSuccess}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('parent.welcome')}
        subtitle={`${t('parent.studentOf')} ${profile.displayName || 'Student'}${profile.college ? ` • ${profile.college}` : ''}`}
        actions={
          isDemoMode ? (
            <Badge tone="amber">{t('demo.label')}</Badge>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkLink}
                disabled={loadingLink}
                className="gap-1.5 bg-white text-xs"
              >
                <RefreshCw size={12} className={loadingLink ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                <ShieldCheck size={13} className="text-teal-600" aria-hidden />
                Verified Parent
              </span>
            </div>
          )
        }
      />

      {/* Privacy note */}
      <p className="mb-6 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-ink-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
        {t('parent.privacyNote')}
      </p>

      {/* Academic summary (B2) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <GraduationCap size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('parent.academicSummary')}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{summary}</p>

          {/* Structured Academic Details Grid */}
          <div className="mt-5 grid grid-cols-1 gap-3.5 border-t border-line/60 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-ink-subtle">College / Institution</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{profile.college || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-subtle">Engineering Branch</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{profile.branch || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-subtle">Current Year & Semester</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                {profile.year ? `${profile.year}${profile.semester ? ` • ${profile.semester}` : ''}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-subtle">Target Career Goals</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                {profile.careerInterests && profile.careerInterests.length > 0
                  ? profile.careerInterests.join(', ')
                  : '—'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-ink-subtle">Current Study Goal</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{profile.currentGoal || '—'}</p>
            </div>
            {strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-subtle">Academic Strengths</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {strengths.map((s, idx) => (
                    <Badge key={idx} tone="teal">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {improvement.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-subtle">Focus & Weak Subjects</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {improvement.map((s, idx) => (
                    <Badge key={idx} tone="amber">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card className="flex flex-col justify-center">
          <p className="text-sm font-medium text-ink-muted">{t('student.stats.cgpa')}</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{displayCgpa ?? '—'}</p>
          {records.length > 0 ? (
            <p className="mt-1 text-xs text-ink-subtle">
              Computed from {records.length} coursework {records.length === 1 ? 'subject' : 'subjects'}
            </p>
          ) : profile.cgpa ? (
            <p className="mt-1 text-xs text-ink-subtle">Reported academic score</p>
          ) : (
            <p className="mt-1 text-xs text-ink-subtle">No marks recorded yet</p>
          )}
          {trend > 0 ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp size={14} aria-hidden /> trending up ({semesterGpas[0].sgpa.toFixed(1)} → {cgpa.toFixed(1)})
            </p>
          ) : (
            <p className="mt-2 text-xs text-ink-subtle">{t('trend.stable')}</p>
          )}
        </Card>
      </div>

      {/* Course Marks & Grades Breakdown (if student has academic records) */}
      {records.length > 0 && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <BookOpen size={18} aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">Academic Marks & Course Grades</h2>
                <p className="text-xs text-ink-muted">Official coursework records verified from student profile</p>
              </div>
            </div>
            <Badge tone="blue">{records.length} Courses</Badge>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-slate-50/50 text-xs font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Semester</th>
                  <th className="px-3 py-2.5 text-right">Marks / Score</th>
                  <th className="px-3 py-2.5 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-medium text-ink">{r.subject}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{r.semester}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-ink">{r.marks} / 100</td>
                    <td className="px-3 py-2.5 text-right">
                      <Badge
                        tone={
                          r.grade?.startsWith('A')
                            ? 'teal'
                            : r.grade?.startsWith('B')
                              ? 'blue'
                              : 'amber'
                        }
                      >
                        {r.grade || '—'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Shared goals (B3) + Support suggestions (B5) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Target size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('parent.sharedGoals')}</h2>
          </div>
          {sharedGoals.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {sharedGoals.map((g) => (
                <li key={g.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{g.title}</p>
                    <span className="text-xs text-ink-subtle">{g.progress}%</span>
                  </div>
                  <ProgressBar className="mt-2" value={g.progress} tone="teal" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-subtle">{t('common.none')}</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <LifeBuoy size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('parent.supportSuggestions')}</h2>
          </div>
          <ul className="mt-3 space-y-3">
            {supportSuggestions.map((s) => (
              <li key={s.id}>
                <p className="text-sm font-medium text-ink">{s.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{s.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Achievements (B7) + Family action plan (B10) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Trophy size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('parent.achievements')}</h2>
          </div>
          {achievements.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden />
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

        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ClipboardList size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('parent.actionPlan')}</h2>
          </div>
          <ul className="mt-4 space-y-2">
            {plan.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => toggle(it.id)}
                  aria-pressed={it.status === 'done'}
                  className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                      it.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white',
                    )}
                  >
                    {it.status === 'done' ? <CheckCircle2 size={14} aria-hidden /> : null}
                  </span>
                  <span className={cn('flex-1 text-sm', it.status === 'done' ? 'text-ink-subtle line-through' : 'text-ink')}>
                    {it.title}
                  </span>
                  <Badge tone={it.owner === 'student' ? 'blue' : 'teal'}>{it.owner}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Engineering Course Advisor entry card */}
      <Card className="mt-6 border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50" padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
              <Compass size={22} aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">{t('parent.courseAdvisorTitle')}</h2>
              <p className="mt-1 max-w-xl text-sm text-ink-muted">{t('parent.courseAdvisorDesc')}</p>
            </div>
          </div>
          <Link
            to="/parent/course-advisor"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('landing.findBestFitBranch')}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </Card>

      {/* Family Decision Comparison entry card */}
      <Card className="mt-4 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50" padding="lg">
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
            to="/parent/decisions"
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
