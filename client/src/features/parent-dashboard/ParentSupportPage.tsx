import { useMemo, useState } from 'react'
import { CheckCircle2, LifeBuoy } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/utils/cn'
import { computeCgpa, computeSemesterGpas, computeStreak } from '@/utils/studentStats'
import type { ActionItem } from '@/types'

const ACTION_PLAN_KEY = 'edumitra.parentActionPlan'

function loadPlan(): ActionItem[] | null {
  try {
    const raw = localStorage.getItem(ACTION_PLAN_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function savePlan(plan: ActionItem[]) {
  try { localStorage.setItem(ACTION_PLAN_KEY, JSON.stringify(plan)) } catch { /* ignore */ }
}

/** Generates data-driven suggestions based on real student data. */
function buildSuggestions(
  cgpa: number,
  trend: number,
  sharedGoalCount: number,
  streak: number,
  weakSubjects: string[],
): { id: string; title: string; why: string; action: string; convoStarter: string }[] {
  const suggestions: { id: string; title: string; why: string; action: string; convoStarter: string }[] = []

  if (streak < 3) {
    suggestions.push({
      id: 's-streak',
      title: 'Help establish a consistent daily study habit',
      why: `The learning streak is currently ${streak} day(s). Consistency matters more than long study sessions — even 45 minutes daily compounds over a semester.`,
      action: 'Agree on a fixed evening study slot. Remove distractions (phone in another room) during that window.',
      convoStarter: '"What time of day do you feel most focused? Let\'s protect that slot every day this week."',
    })
  }

  if (cgpa > 0 && cgpa < 7.0) {
    suggestions.push({
      id: 's-cgpa',
      title: 'Discuss academic support options proactively',
      why: `The current CGPA is ${cgpa.toFixed(2)}. Many campus placements require 6.5–7.5 CGPA cutoffs, so early action provides more room to improve.`,
      action: 'Ask if the student needs tutoring, study groups, or faculty office hours for specific subjects.',
      convoStarter: '"Which subject feels hardest right now? Would extra help — like a tutor or study group — make a difference?"',
    })
  }

  if (weakSubjects.length > 0) {
    suggestions.push({
      id: 's-subjects',
      title: `Support focused revision on: ${weakSubjects.slice(0, 2).join(', ')}`,
      why: `These subjects show lower average marks. Identifying them early allows focused preparation before exams.`,
      action: 'Encourage the student to allocate extra study time (30–45 min more per day) to these subjects.',
      convoStarter: `"I noticed ${weakSubjects[0]} needs some work. Would it help to set aside extra time for it this weekend?"`,
    })
  }

  if (trend < -0.2) {
    suggestions.push({
      id: 's-trend',
      title: 'Explore what changed between semesters',
      why: 'Academic performance has declined between semesters. A compassionate, curious conversation can help identify the root cause without added pressure.',
      action: 'Schedule a calm 1:1 conversation to listen — not lecture. Focus on understanding, not judgment.',
      convoStarter: '"I noticed this semester felt different. Is there anything on your mind that we can work through together?"',
    })
  }

  if (sharedGoalCount === 0) {
    suggestions.push({
      id: 's-goals',
      title: 'Encourage the student to set and share a goal',
      why: 'No goals have been shared yet. Goal-setting improves self-direction and helps families provide targeted support.',
      action: 'Ask the student to share at least one goal so you can track it together from the Goals page.',
      convoStarter: '"What\'s one thing you want to achieve before the end of this semester? Let\'s make it official."',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 's-positive',
      title: 'Acknowledge and celebrate progress',
      why: 'The academic indicators look healthy. Recognition from family is a powerful motivator during demanding engineering studies.',
      action: 'Express specific appreciation — not just "good job", but name what you noticed (streak, goal completion, grade improvement).',
      convoStarter: '"I saw you\'ve been studying consistently this week. That takes real discipline — I\'m proud of you."',
    })
  }

  return suggestions
}

const DEFAULT_PLAN: ActionItem[] = [
  { id: 'ap1', title: 'Confirm internship shortlist with student before November', owner: 'family', status: 'pending' },
  { id: 'ap2', title: 'Review certification course fee with student', owner: 'family', status: 'pending' },
  { id: 'ap3', title: 'Weekly 20-minute progress check-in (every Sunday)', owner: 'family', status: 'done' },
]

export function ParentSupportPage() {
  const { t } = useLanguage()
  const { data } = useStudentData()
  const { profile, records, goals, tasks, activities } = data

  const cgpa = useMemo(() => computeCgpa(records), [records])
  const semesterGpas = useMemo(() => computeSemesterGpas(records), [records])
  const streak = useMemo(() => computeStreak(tasks, activities), [tasks, activities])
  const sharedGoals = goals.filter((g) => g.shared)

  const trend = semesterGpas.length >= 2
    ? semesterGpas[semesterGpas.length - 1].sgpa - semesterGpas[0].sgpa
    : 0

  // Compute weak subjects from record averages
  const weakSubjects = useMemo(() => {
    const map = new Map<string, number[]>()
    records.forEach((r) => {
      if (!map.has(r.subject)) map.set(r.subject, [])
      map.get(r.subject)!.push(r.marks)
    })
    return [...map.entries()]
      .map(([subject, marks]) => ({ subject, avg: marks.reduce((a, b) => a + b, 0) / marks.length }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3)
      .filter((s) => s.avg < 65)
      .map((s) => s.subject)
  }, [records])

  const suggestions = useMemo(
    () => buildSuggestions(cgpa, trend, sharedGoals.length, streak, weakSubjects),
    [cgpa, trend, sharedGoals.length, streak, weakSubjects],
  )

  const [plan, setPlan] = useState<ActionItem[]>(() => loadPlan() ?? DEFAULT_PLAN)
  const togglePlan = (id: string) => {
    const next = plan.map((it) =>
      it.id === id ? { ...it, status: (it.status === 'done' ? 'pending' : 'done') as ActionItem['status'] } : it
    )
    setPlan(next); savePlan(next)
  }

  const doneCount = plan.filter((p) => p.status === 'done').length

  return (
    <div>
      <PageHeader
        title={t('parentSupport.title')}
        subtitle={`${t('parentSupport.subtitle')} — ${profile.displayName}`}
      />

      {/* Support Suggestions */}
      <div className="mb-6 space-y-4">
        {suggestions.map((s, i) => (
          <Card key={s.id} className="border-l-4 border-l-blue-400">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-semibold text-ink">{s.title}</p>

                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle mb-0.5">{t('parentSupport.whySuggested')}</p>
                  <p className="text-xs text-ink-muted">{s.why}</p>
                </div>

                <div className="rounded-lg bg-teal-50 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600 mb-0.5">{t('parentSupport.actionForParent')}</p>
                  <p className="text-xs text-teal-800">{s.action}</p>
                </div>

                <div className="rounded-lg bg-amber-50 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">{t('parentSupport.discussionStarter')}</p>
                  <p className="text-xs italic text-amber-800">{s.convoStarter}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Family Action Plan */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <LifeBuoy size={18} aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-ink">{t('parent.actionPlan')}</h2>
            <p className="text-xs text-ink-muted">{doneCount}/{plan.length} items completed</p>
          </div>
        </div>
        <div className="mb-3">
          <ProgressBar value={plan.length ? (doneCount / plan.length) * 100 : 0} tone="teal" />
        </div>
        <ul className="space-y-2">
          {plan.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => togglePlan(it.id)}
                aria-pressed={it.status === 'done'}
                className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <span className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                  it.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                )}>
                  {it.status === 'done' && <CheckCircle2 size={14} aria-hidden />}
                </span>
                <span className={cn('flex-1 text-sm', it.status === 'done' ? 'text-ink-subtle line-through' : 'text-ink')}>
                  {it.title}
                </span>
                <Badge tone={it.owner === 'student' ? 'blue' : 'teal'}>{it.owner}</Badge>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-subtle">{t('common.localNote')}</p>
      </Card>
    </div>
  )
}
