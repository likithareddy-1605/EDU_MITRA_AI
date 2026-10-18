import { useMemo, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { useBackendConfig } from '@/hooks/useBackendConfig'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import {
  bottomSubjects,
  computeCgpa,
  computeSemesterGpas,
  computeStreak,
  computeSubjectAverages,
  computeUpcoming,
  topSubjects,
} from '@/utils/studentStats'
import { askAdvisor, getAdvisorSummary, type AdvisorContext } from '@/services/academicAdvisorApi'


function daysLeft(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export function AcademicAdvisorPage() {
  const { t } = useLanguage()
  const { data } = useStudentData()
  const { isAiConfigured } = useBackendConfig()
  const { profile, records, goals, tasks, activities } = data

  const cgpa = useMemo(() => computeCgpa(records), [records])
  const semesterGpas = useMemo(() => computeSemesterGpas(records), [records])
  const subjectAverages = useMemo(() => computeSubjectAverages(records), [records])
  const strongSubjects = useMemo(() => topSubjects(subjectAverages, 3), [subjectAverages])
  const weakSubjects = useMemo(() => bottomSubjects(subjectAverages, 3), [subjectAverages])
  const upcoming = useMemo(() => computeUpcoming(goals, tasks, 6), [goals, tasks])
  const streak = useMemo(() => computeStreak(tasks, activities), [tasks, activities])

  const ctx: AdvisorContext = {
    profile: { displayName: profile.displayName, branch: profile.branch, year: profile.year },
    cgpa,
    semesterGpas,
    subjectAverages: subjectAverages.map((s) => ({ subject: s.subject, averageMarks: s.averageMarks, trend: s.trend })),
    weakSubjects,
    strongSubjects,
    goals: goals.filter((g) => g.status !== 'completed').map((g) => ({ title: g.title, progress: g.progress, deadline: g.deadline })),
    upcoming: upcoming.map((u) => ({ title: u.title, due: u.due })),
    streak,
  }

  // Rule-based personalized study plan (C2/C9/C11).
  const studyPlan = useMemo(() => {
    const plan: { focus: string; detail: string }[] = []
    weakSubjects.slice(0, 3).forEach((s) =>
      plan.push({ focus: `Revise ${s}`, detail: '3×/week, ~45 min/session' }),
    )
    upcoming.slice(0, 3).forEach((u) =>
      plan.push({ focus: `Prepare for ${u.title}`, detail: 'daily until due, ~30 min' }),
    )
    return plan
  }, [weakSubjects, upcoming])

  const minutesPerDay = Math.min(180, weakSubjects.length * 30 + Math.min(upcoming.length, 3) * 20)

  // AI summary state (C12).
  const [summary, setSummary] = useState<{ loading: boolean; source?: 'ai' | 'fallback'; text?: string; error?: boolean }>({ loading: false })
  const runSummary = async () => {
    setSummary({ loading: true })
    try {
      const r = await getAdvisorSummary(ctx)
      setSummary({ loading: false, source: r.source, text: r.text })
    } catch {
      setSummary({ loading: false, error: true })
    }
  }

  // AI assistant state (C4/C8).
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<{ loading: boolean; source?: 'ai' | 'fallback'; text?: string; error?: boolean }>({ loading: false })
  const runAsk = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (!question.trim()) return
    setAnswer({ loading: true })
    try {
      const r = await askAdvisor(ctx, question.trim())
      setAnswer({ loading: false, source: r.source, text: r.text })
    } catch {
      setAnswer({ loading: false, error: true })
    }
  }

  // Practice prompts (C10) — rule-based for the chosen subject.
  const [practiceSubject, setPracticeSubject] = useState(weakSubjects[0] ?? '')
  const prompts = practiceSubject
    ? [
        `Define and explain the core concepts in ${practiceSubject}.`,
        `Solve 5 practice problems from past papers on ${practiceSubject}.`,
        `Explain one key ${practiceSubject} topic in simple words, as if teaching a friend.`,
      ]
    : []

  return (
    <div>
      <PageHeader
        title={t('advisor.title')}
        subtitle={t('advisor.subtitle')}
        actions={
          isAiConfigured
            ? null
            : <Badge tone="amber">{t('demo.label')}</Badge>
        }
      />

      <p className="mb-6 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-ink-muted">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-blue-600" aria-hidden />
        {isAiConfigured
          ? 'AI responses are generated by Gemini — personalised to your actual academic data.'
          : t('advisor.contextNote')}
      </p>

      {/* Performance insights (C7) + Weak subject analysis (C3) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink">{t('advisor.insights')}</h2>
          <div className="mt-3">
            <p className="text-sm font-medium text-ink">{t('student.strongSubjects')}</p>
            <ul className="mt-2 space-y-1">
              {strongSubjects.length ? strongSubjects.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-ink"><CheckCircle2 size={14} className="text-emerald-600" /> {s}</li>
              )) : <li className="text-sm text-ink-subtle">—</li>}
            </ul>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-ink">CGPA: <span className="text-blue-600">{cgpa.toFixed(2)}</span></p>
            <p className="text-xs text-ink-subtle">Semesters recorded: {semesterGpas.length}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">{t('advisor.weakAnalysis')}</h2>
          <p className="mt-1 text-xs text-ink-subtle">{t('advisor.weakHint')}</p>
          {weakSubjects.length ? (
            <ul className="mt-3 space-y-3">
              {weakSubjects.map((s) => {
                const avg = subjectAverages.find((x) => x.subject === s)?.averageMarks ?? 0
                return (
                <li key={s}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink"><AlertCircle size={14} className="text-amber-600" /> {s}</span>
                    <span className="text-xs text-ink-subtle">{t('academics.avg')} {avg}</span>
                  </div>
                  <ProgressBar className="mt-2" value={avg} tone="amber" />
                </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-subtle">—</p>
          )}
        </Card>
      </div>

      {/* Personalized study plan (C2/C9/C11) */}
      <Card className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">{t('advisor.studyPlan')}</h2>
          <Badge tone="teal"><Clock size={12} className="mr-1" aria-hidden /> {t('advisor.studyTime')}: {minutesPerDay} {t('advisor.minutesPerDay')}</Badge>
        </div>
        {studyPlan.length ? (
          <ul className="mt-3 space-y-2">
            {studyPlan.map((p) => (
              <li key={p.focus} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                <span className="text-sm font-medium text-ink">{p.focus}</span>
                <span className="text-xs text-ink-subtle">{p.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-4" title={t('academics.empty')} />
        )}
      </Card>

      {/* Exam preparation planner (C5) */}
      <Card className="mt-6">
        <h2 className="text-base font-semibold text-ink">{t('advisor.examPrep')}</h2>
        {upcoming.length ? (
          <ul className="mt-3 space-y-3">
            {upcoming.map((u) => {
              const left = daysLeft(u.due)
              return (
              <li key={u.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink"><CalendarClock size={14} className="text-slate-400" /> {u.title}</span>
                  <Badge tone={left <= 3 ? 'red' : left <= 7 ? 'amber' : 'neutral'}>{left} {t('advisor.daysLeft')}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{t('advisor.prepSteps')}</p>
              </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState className="mt-4" title={t('advisor.noUpcoming')} />
        )}
      </Card>

      {/* AI progress summary (C12) */}
      <Card className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{t('advisor.summary')}</h2>
          <Button variant="outline" size="sm" onClick={runSummary} disabled={summary.loading}>
            <Sparkles size={14} aria-hidden /> {t('advisor.generateSummary')}
          </Button>
        </div>
        {summary.loading ? <p className="mt-3 text-sm text-ink-muted">{t('advisor.aiLoading')}</p> : null}
        {summary.text ? (
          <div className="mt-3">
            <Badge tone={summary.source === 'ai' ? 'teal' : 'amber'}>{summary.source === 'ai' ? t('advisor.aiSummaryLabel') : t('advisor.aiDemo')}</Badge>
            <p className="mt-2 whitespace-pre-line text-sm text-ink">{summary.text}</p>
          </div>
        ) : null}
        {summary.error ? <p className="mt-3 text-sm text-red-600">{t('advisor.aiError')}</p> : null}
      </Card>

      {/* AI study assistant (C4/C8) */}
      <Card className="mt-6">
        <h2 className="text-base font-semibold text-ink">{t('advisor.assistant')}</h2>
        <form onSubmit={runAsk} noValidate className="mt-3 flex gap-2">
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('advisor.askPlaceholder')} aria-label={t('advisor.ask')} />
          <Button type="submit" disabled={answer.loading || !question.trim()}><Send size={14} aria-hidden /> {t('advisor.ask')}</Button>
        </form>
        {answer.loading ? <p className="mt-3 text-sm text-ink-muted">{t('advisor.aiLoading')}</p> : null}
        {answer.text ? (
          <div className="mt-3">
            <Badge tone={answer.source === 'ai' ? 'teal' : 'amber'}>{answer.source === 'ai' ? t('advisor.aiAnswerLabel') : t('advisor.aiDemo')}</Badge>
            <p className="mt-2 whitespace-pre-line text-sm text-ink">{answer.text}</p>
          </div>
        ) : null}
        {answer.error ? <p className="mt-3 text-sm text-red-600">{t('advisor.aiError')}</p> : null}
      </Card>

      {/* Practice prompts (C10) */}
      <Card className="mt-6">
        <h2 className="text-base font-semibold text-ink">{t('advisor.practice')}</h2>
        <p className="mt-1 text-xs text-ink-subtle">{t('advisor.practiceHint')}</p>
        {weakSubjects.length ? (
          <>
            <Field label={t('advisor.chooseSubject')} htmlFor="practiceSubject" className="mt-3 mb-3">
              <Select id="practiceSubject" value={practiceSubject} onChange={(e) => setPracticeSubject(e.target.value)}>
                {weakSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <ul className="space-y-2">
              {prompts.map((p) => (
                <li key={p} className="rounded-lg border border-line p-3 text-sm text-ink">{p}</li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState className="mt-4" title={t('academics.empty')} />
        )}
      </Card>

      <p className="mt-6 text-xs text-ink-subtle">{t('common.localNote')}</p>
    </div>
  )
}
