import { useState, type FormEvent } from 'react'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useStudentData } from '@/hooks/useStudentData'
import { useLanguage } from '@/hooks/useLanguage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import type { Priority, WeekDay } from '@/types'
import type { BadgeTone } from '@/components/ui/Badge'
import type { TranslationKey } from '@/locales/en'

const weekDays: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const priorities: Priority[] = ['high', 'medium', 'low']
const priorityTone: Record<Priority, BadgeTone> = { high: 'red', medium: 'amber', low: 'neutral' }

interface TaskForm {
  title: string
  subject: string
  day: WeekDay
  priority: Priority
  due: string
}
const blankForm: TaskForm = { title: '', subject: '', day: 'Mon', priority: 'medium', due: '' }

export function StudyPlannerPage() {
  const { t } = useLanguage()
  const { data, addTask, toggleTask, deleteTask } = useStudentData()
  const tasks = data.tasks
  const [form, setForm] = useState<TaskForm>(blankForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = t('common.required')
    if (!form.subject.trim()) e.subject = t('common.required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (!validate()) return
    addTask({
      title: form.title.trim(),
      subject: form.subject.trim(),
      day: form.day,
      priority: form.priority,
      due: form.due || undefined,
    })
    setForm(blankForm)
    setErrors({})
  }

  const completed = tasks.filter((tk) => tk.completed).length

  return (
    <div>
      <PageHeader title={t('planner.title')} subtitle={t('planner.subtitle')} />

      <div className="grid grid-cols-2 gap-4">
        <StatCard label={t('planner.totalTasks')} value={tasks.length} tone="blue" />
        <StatCard label={t('planner.completedTasks')} value={completed} tone="green" />
      </div>

      <Card className="mt-6">
        <h2 className="text-base font-semibold text-ink">{t('planner.addTask')}</h2>
        <form onSubmit={onSubmit} noValidate className="mt-4">
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label={t('planner.taskTitle')} htmlFor="taskTitle" required error={errors.title}>
              <Input
                id="taskTitle"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="DSA practice"
              />
            </Field>
            <Field label={t('planner.subject')} htmlFor="taskSubject" required error={errors.subject}>
              <Input
                id="taskSubject"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="Data Structures"
              />
            </Field>
            <Field label={t('planner.day')} htmlFor="taskDay">
              <Select id="taskDay" value={form.day} onChange={(e) => set('day', e.target.value as WeekDay)}>
                {weekDays.map((d) => (
                  <option key={d} value={d}>
                    {t(`day.${d}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('planner.priority')} htmlFor="taskPriority">
              <Select
                id="taskPriority"
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as Priority)}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {t(`priority.${p}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('planner.due')} htmlFor="taskDue">
              <Input id="taskDue" type="date" value={form.due} onChange={(e) => set('due', e.target.value)} />
            </Field>
          </div>
          <Button type="submit">
            <Plus size={16} aria-hidden /> {t('common.add')}
          </Button>
        </form>
        <p className="mt-3 text-xs text-ink-subtle">{t('common.localNote')}</p>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {weekDays.map((day) => {
          const dayTasks = tasks.filter((tk) => tk.day === day)
          return (
            <Card key={day} padding="sm" className="flex min-h-[140px] flex-col">
              <h3 className="text-sm font-semibold text-ink">{t(`day.${day}` as TranslationKey)}</h3>
              <div className="mt-2 flex-1 space-y-2">
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-ink-subtle">{t('planner.empty')}</p>
                ) : (
                  dayTasks.map((tk) => (
                    <div
                      key={tk.id}
                      className={cn(
                        'rounded-lg border p-2',
                        tk.completed ? 'border-emerald-200 bg-emerald-50' : 'border-line bg-white',
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className={cn(
                            'text-xs font-medium',
                            tk.completed ? 'text-ink-subtle line-through' : 'text-ink',
                          )}
                        >
                          {tk.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteTask(tk.id)}
                          aria-label={t('common.delete')}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="truncate text-[11px] text-ink-subtle">{tk.subject}</span>
                        <Badge tone={priorityTone[tk.priority]}>{t(`priority.${tk.priority}` as TranslationKey)}</Badge>
                      </div>
                      {tk.due ? <p className="mt-1 text-[11px] text-ink-subtle">{formatDate(tk.due)}</p> : null}
                      <button
                        type="button"
                        onClick={() => toggleTask(tk.id)}
                        className={cn(
                          'mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs font-medium',
                          tk.completed ? 'text-ink-subtle' : 'text-blue-600 hover:bg-blue-50',
                        )}
                      >
                        <CheckCircle2 size={13} /> {tk.completed ? t('status.completed') : t('goals.complete')}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
