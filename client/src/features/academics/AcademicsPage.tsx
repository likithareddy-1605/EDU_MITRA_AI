import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { StatCard } from '@/components/ui/StatCard'
import { computeCgpa, computeSemesterGpas, computeSubjectAverages } from '@/utils/studentStats'
import type { AcademicRecord, PerformanceTrend } from '@/types'
import type { BadgeTone } from '@/components/ui/Badge'
import type { TranslationKey } from '@/locales/en'

const trendIcon: Record<PerformanceTrend, ReactNode> = {
  up: <ArrowUpRight size={14} className="text-emerald-600" aria-hidden />,
  down: <ArrowDownRight size={14} className="text-red-600" aria-hidden />,
  stable: <Minus size={14} className="text-slate-400" aria-hidden />,
}
const trendTone: Record<PerformanceTrend, BadgeTone> = { up: 'green', down: 'red', stable: 'neutral' }

interface RecordForm {
  semester: string
  subject: string
  marks: string
  grade: string
}

const blankForm: RecordForm = { semester: '1', subject: '', marks: '', grade: '' }

export function AcademicsPage() {
  const { t } = useLanguage()
  const { data, addRecord, updateRecord, deleteRecord } = useStudentData()
  const records = data.records

  const cgpa = useMemo(() => computeCgpa(records), [records])
  const semesterGpas = useMemo(() => computeSemesterGpas(records), [records])
  const subjectAverages = useMemo(() => computeSubjectAverages(records), [records])

  const [form, setForm] = useState<RecordForm>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: keyof RecordForm, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const sem = Number(form.semester)
    if (!Number.isInteger(sem) || sem < 1 || sem > 8) e.semester = t('common.required')
    if (!form.subject.trim()) e.subject = t('common.required')
    const marks = Number(form.marks)
    if (Number.isNaN(marks) || marks < 0 || marks > 100) e.marks = t('common.required')
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
    const payload = {
      semester: Number(form.semester),
      subject: form.subject.trim(),
      marks: Number(form.marks),
      grade: form.grade.trim() || '-',
    }
    if (editingId) updateRecord(editingId, payload)
    else addRecord(payload)
    reset()
  }

  const startEdit = (r: AcademicRecord) => {
    setEditingId(r.id)
    setForm({ semester: String(r.semester), subject: r.subject, marks: String(r.marks), grade: r.grade })
  }

  return (
    <div>
      <PageHeader title={t('academics.title')} subtitle={t('academics.subtitle')} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label={t('academics.cgpa')} value={cgpa.toFixed(2)} tone="blue" />
        <StatCard label={t('academics.semesters')} value={semesterGpas.length} tone="teal" />
        <StatCard label={t('academics.subjects')} value={subjectAverages.length} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">{t('academics.semesterComparison')}</h2>
          {semesterGpas.length > 0 ? (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semesterGpas} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="sgpa" name="SGPA" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState className="mt-4" title={t('academics.empty')} />
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">{t('academics.subjectPerformance')}</h2>
          {subjectAverages.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {subjectAverages.map((s) => (
                <li key={s.subject}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{s.subject}</span>
                    <Badge tone={trendTone[s.trend]}>
                      {trendIcon[s.trend]} {t(`trend.${s.trend}` as TranslationKey)}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <ProgressBar value={s.averageMarks} tone="blue" />
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {t('academics.avg')} {s.averageMarks}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4" title={t('academics.empty')} />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-base font-semibold text-ink">
          {editingId ? t('academics.editRecord') : t('academics.addRecord')}
        </h2>
        <form onSubmit={onSubmit} noValidate className="mt-4">
          <div className="grid gap-x-4 sm:grid-cols-4">
            <Field label={t('academics.semester')} htmlFor="semester" error={errors.semester}>
              <Input
                id="semester"
                type="number"
                min={1}
                max={8}
                value={form.semester}
                onChange={(e) => set('semester', e.target.value)}
              />
            </Field>
            <Field label={t('academics.subject')} htmlFor="subject" error={errors.subject}>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="Data Structures"
              />
            </Field>
            <Field label={t('academics.marks')} htmlFor="marks" error={errors.marks}>
              <Input
                id="marks"
                type="number"
                min={0}
                max={100}
                value={form.marks}
                onChange={(e) => set('marks', e.target.value)}
                placeholder="0–100"
              />
            </Field>
            <Field label={t('academics.grade')} htmlFor="grade">
              <Input id="grade" value={form.grade} onChange={(e) => set('grade', e.target.value)} placeholder="A" />
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
        <h2 className="text-base font-semibold text-ink">{t('academics.records')}</h2>
        {records.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {records.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2.5 py-3 sm:py-2.5">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Badge tone="neutral">Sem {r.semester}</Badge>
                  <span className="text-sm font-medium text-ink break-words">{r.subject}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-xs sm:text-sm text-ink-muted">{r.marks}/100</span>
                  <Badge tone="blue">{r.grade}</Badge>
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="text-slate-500 hover:text-blue-600"
                    aria-label={t('common.edit')}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRecord(r.id)}
                    className="text-slate-500 hover:text-red-600"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-4" title={t('academics.empty')} />
        )}
      </Card>
    </div>
  )
}
