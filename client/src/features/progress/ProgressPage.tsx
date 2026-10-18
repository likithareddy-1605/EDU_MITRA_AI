import { useState, type FormEvent } from 'react'
import { CheckCircle2, Flame, Plus, Trash2, Trophy } from 'lucide-react'
import { useStudentData } from '@/hooks/useStudentData'
import { useLanguage } from '@/hooks/useLanguage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import {
  activeDaysSet,
  bottomSubjects,
  computeStreak,
  computeSubjectAverages,
  goalProgressAverage,
  recommendedNextAction,
  readinessEstimate,
  tasksCompletedLastDays,
  topSubjects,
} from '@/utils/studentStats'
import { formatDate } from '@/utils/format'
import type { AchievementType } from '@/types'
import type { TranslationKey } from '@/locales/en'

const achievementTypes: AchievementType[] = ['project', 'certification', 'goal', 'award']

export function ProgressPage() {
  const { t } = useLanguage()
  const { data, addAchievement, deleteAchievement, logStudyToday } = useStudentData()
  const { goals, tasks, achievements, activities, records, profile } = data

  const streak = computeStreak(tasks, activities)
  const avgProgress = goalProgressAverage(goals)
  const completedGoals = goals.filter((g) => g.status === 'completed').length
  const tasksWeek = tasksCompletedLastDays(tasks, 7)
  const subjectAverages = computeSubjectAverages(records)
  const strengths = topSubjects(subjectAverages, 3)
  const improvement = bottomSubjects(subjectAverages, 3)
  const recommended = recommendedNextAction(goals, tasks)
  const readiness = readinessEstimate(profile, goals)
  const activeDays = [...activeDaysSet(tasks, activities)].sort().reverse().slice(0, 7)

  const [achForm, setAchForm] = useState<{ title: string; date: string; type: AchievementType }>({
    title: '',
    date: '',
    type: 'project',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const onAddAch = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!achForm.title.trim()) e.title = t('common.required')
    if (!achForm.date) e.date = t('common.required')
    setErrors(e)
    if (Object.keys(e).length > 0) return
    addAchievement({ title: achForm.title.trim(), date: achForm.date, type: achForm.type })
    setAchForm({ title: '', date: '', type: 'project' })
  }

  return (
    <div>
      <PageHeader title={t('progress.title')} subtitle={t('progress.subtitle')} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('progress.completedGoals')} value={completedGoals} tone="green" icon={<CheckCircle2 size={20} aria-hidden />} />
        <StatCard label={t('progress.avgProgress')} value={`${avgProgress}%`} tone="blue" />
        <StatCard label={t('progress.tasksThisWeek')} value={tasksWeek} tone="teal" />
        <StatCard label={t('progress.readiness')} value={`${readiness}%`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">{t('progress.insights')}</h2>
          <div className="mt-3 rounded-lg bg-blue-50/60 p-3 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{t('progress.recommended')}</p>
            <p className="mt-1">{recommended}</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-ink">{t('progress.strengths')}</h3>
              <ul className="mt-2 space-y-1">
                {strengths.length ? (
                  strengths.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-ink">
                      <CheckCircle2 size={14} className="text-emerald-600" /> {s}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-ink-subtle">—</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">{t('progress.improvement')}</h3>
              <ul className="mt-2 space-y-1">
                {improvement.length ? (
                  improvement.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-ink">
                      <span className="text-amber-600">•</span> {s}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-ink-subtle">—</li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">{t('progress.streak')}</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Flame size={24} aria-hidden />
            </span>
            <div>
              <p className="text-2xl font-semibold text-ink">{streak}</p>
              <p className="text-xs text-ink-subtle">{t('progress.streakDays')}</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={logStudyToday}>
            {t('progress.logToday')}
          </Button>
          <p className="mt-2 text-xs text-ink-subtle">{t('progress.logTodayHint')}</p>
          {activeDays.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-muted">{t('progress.activeDays')}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {activeDays.map((d) => (
                  <Badge key={d} tone="amber">
                    {formatDate(d)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">{t('goals.title')}</h2>
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
                    tone={g.status === 'completed' ? 'green' : 'teal'}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4" title={t('goals.empty')} />
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">{t('progress.achievements')}</h2>
          <form onSubmit={onAddAch} noValidate className="mt-3 space-y-3">
            <Field label={t('progress.achievementTitle')} htmlFor="achTitle" error={errors.title}>
              <Input
                id="achTitle"
                value={achForm.title}
                onChange={(e) => setAchForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('progress.date')} htmlFor="achDate" error={errors.date}>
                <Input
                  id="achDate"
                  type="date"
                  value={achForm.date}
                  onChange={(e) => setAchForm((f) => ({ ...f, date: e.target.value }))}
                />
              </Field>
              <Field label={t('progress.type')} htmlFor="achType">
                <Select
                  id="achType"
                  value={achForm.type}
                  onChange={(e) => setAchForm((f) => ({ ...f, type: e.target.value as AchievementType }))}
                >
                  {achievementTypes.map((tp) => (
                    <option key={tp} value={tp}>
                      {t(`achType.${tp}` as TranslationKey)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button type="submit" className="w-full">
              <Plus size={16} aria-hidden /> {t('common.add')}
            </Button>
          </form>
          {achievements.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-2.5">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-600" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-ink">{a.title}</p>
                      <p className="text-xs text-ink-subtle">
                        {formatDate(a.date)} · {t(`achType.${a.type}` as TranslationKey)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAchievement(a.id)}
                    aria-label={t('common.delete')}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4" title={t('progress.empty')} />
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-ink-subtle">{t('common.localNote')}</p>
    </div>
  )
}
