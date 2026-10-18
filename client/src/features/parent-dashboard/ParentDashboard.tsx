import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  GraduationCap,
  LifeBuoy,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { useFamilyDecision } from '@/hooks/useFamilyDecision'
import { branches } from '@/data/courseAdvisorData'
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
  const { data } = useStudentData()
  const { decision } = useFamilyDecision()
  const { profile, records, goals, achievements } = data

  const chosenBranch = branches.find((b) => b.id === decision.finalBranchId) ?? null

  // Computed from the linked student's own records (not hardcoded).
  const cgpa = computeCgpa(records)
  const semesterGpas = computeSemesterGpas(records)
  const subjectAverages = computeSubjectAverages(records)
  const strengths = topSubjects(subjectAverages, 2)
  const improvement = bottomSubjects(subjectAverages, 1)
  const trend =
    semesterGpas.length >= 2 ? semesterGpas[semesterGpas.length - 1].sgpa - semesterGpas[0].sgpa : 0

  // Permission-respecting: only goals the student has chosen to share.
  const sharedGoals = goals.filter((g) => g.shared)

  // Plain-language summary generated from real data.
  const summary =
    `${profile.displayName} is in ${profile.year} of ${profile.branch}. Current CGPA is ${cgpa.toFixed(2)}` +
    (trend > 0 ? `, up from ${semesterGpas[0].sgpa.toFixed(1)} — a positive trend.` : '.') +
    ` Strongest subjects: ${strengths.join(', ') || '—'}. Working to improve: ${improvement.join(', ') || '—'}.`

  // Interactive family action plan (local demo state).
  const [plan, setPlan] = useState<ActionItem[]>(defaultActionPlan)
  const toggle = (id: string) =>
    setPlan((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: it.status === 'done' ? 'pending' : 'done' } : it)),
    )

  return (
    <div>
      <PageHeader
        title={t('parent.welcome')}
        subtitle={`${t('parent.studentOf')} ${profile.displayName}`}
        actions={<Badge tone="amber">{t('demo.label')}</Badge>}
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
        </Card>
        <Card className="flex flex-col justify-center">
          <p className="text-sm font-medium text-ink-muted">{t('student.stats.cgpa')}</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{cgpa.toFixed(2)}</p>
          {trend > 0 ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp size={14} aria-hidden /> trending up ({semesterGpas[0].sgpa.toFixed(1)} → {cgpa.toFixed(1)})
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-subtle">{t('trend.stable')}</p>
          )}
        </Card>
      </div>

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
