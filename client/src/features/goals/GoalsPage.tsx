import { useState, type FormEvent } from 'react'
import { CheckCircle2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
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
import { formatDate } from '@/utils/format'
import type { Goal, GoalCategory, GoalStatus } from '@/types'
import type { BadgeTone } from '@/components/ui/Badge'
import type { TranslationKey } from '@/locales/en'

const categories: GoalCategory[] = [
  'academic',
  'programming',
  'project',
  'certification',
  'internship',
  'placement',
  'career',
]
const statusTone: Record<GoalStatus, BadgeTone> = {
  not_started: 'amber',
  in_progress: 'blue',
  completed: 'green',
}

interface GoalForm {
  title: string
  category: GoalCategory
  progress: string
  deadline: string
  shared: boolean
}
const blankForm: GoalForm = {
  title: '',
  category: 'academic',
  progress: '0',
  deadline: '',
  shared: false,
}

export function GoalsPage() {
  const { t } = useLanguage()
  const { data, addGoal, updateGoal, deleteGoal, toggleGoalComplete } = useStudentData()
  const [form, setForm] = useState<GoalForm>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof GoalForm>(key: K, value: GoalForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = t('common.required')
    const p = Number(form.progress)
    if (Number.isNaN(p) || p < 0 || p > 100) e.progress = t('common.required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const reset = () => {
    setForm(blankForm)
    setEditingId(null)
    setErrors({})
  }

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (!validate()) return
    const progress = Number(form.progress)
    const status: GoalStatus = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
    const payload = {
      title: form.title.trim(),
      category: form.category,
      progress,
      deadline: form.deadline || undefined,
      shared: form.shared,
      status,
    }
    if (editingId) updateGoal(editingId, payload)
    else addGoal(payload)
    reset()
  }

  const startEdit = (g: Goal) => {
    setEditingId(g.id)
    setForm({
      title: g.title,
      category: g.category,
      progress: String(g.progress),
      deadline: g.deadline ?? '',
      shared: g.shared,
    })
  }

  return (
    <div>
      <PageHeader title={t('goals.title')} subtitle={t('goals.subtitle')} />

      <Card>
        <h2 className="text-base font-semibold text-ink">{editingId ? t('goals.editGoal') : t('goals.addGoal')}</h2>
        <form onSubmit={onSubmit} noValidate className="mt-4">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label={t('goals.goalTitle')} htmlFor="goalTitle" required error={errors.title} className="sm:col-span-2">
              <Input
                id="goalTitle"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Complete DSA practice set"
              />
            </Field>
            <Field label={t('goals.category')} htmlFor="category">
              <Select id="category" value={form.category} onChange={(e) => set('category', e.target.value as GoalCategory)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {t(`goalCat.${c}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('goals.progress')} htmlFor="progress" error={errors.progress} hint="0–100">
              <Input
                id="progress"
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => set('progress', e.target.value)}
              />
            </Field>
            <Field label={t('goals.deadline')} htmlFor="deadline">
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </Field>
            <Field label={t('goals.shared')} htmlFor="shared" hint={t('goals.sharedHint')}>
              <input
                id="shared"
                type="checkbox"
                checked={form.shared}
                onChange={(e) => set('shared', e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit">
              {editingId ? <Pencil size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
              {editingId ? t('common.update') : t('common.add')}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={reset}>
                {t('common.cancel')}
              </Button>
            ) : null}
          </div>
        </form>
        <p className="mt-3 text-xs text-ink-subtle">{t('common.localNote')}</p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-base font-semibold text-ink">{t('goals.title')}</h2>
        {data.goals.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {data.goals.map((g) => (
              <li key={g.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{g.title}</span>
                    <Badge tone="neutral">{t(`goalCat.${g.category}` as TranslationKey)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone[g.status]}>{t(`status.${g.status}` as TranslationKey)}</Badge>
                    <button
                      type="button"
                      onClick={() => toggleGoalComplete(g.id)}
                      className="text-slate-500 hover:text-emerald-600"
                      aria-label={g.status === 'completed' ? t('goals.reopen') : t('goals.complete')}
                    >
                      {g.status === 'completed' ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(g)}
                      className="text-slate-500 hover:text-blue-600"
                      aria-label={t('common.edit')}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGoal(g.id)}
                      className="text-slate-500 hover:text-red-600"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <ProgressBar
                  className="mt-3"
                  value={g.progress}
                  tone={g.status === 'completed' ? 'green' : 'teal'}
                />
                <div className="mt-1 flex items-center gap-3 text-xs text-ink-subtle">
                  <span>{g.progress}%</span>
                  {g.deadline ? <span>· {formatDate(g.deadline)}</span> : null}
                  {g.shared ? <span>· {t('goals.shared')}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-4" title={t('goals.empty')} />
        )}
      </Card>
    </div>
  )
}
