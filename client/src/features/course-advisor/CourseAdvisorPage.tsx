import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Info,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { cn } from '@/utils/cn'
import {
  branches,
  careerGoalOptions,
  emptyAssessment,
  interestOptions,
  subjectOptions,
  type CollegeType,
  type CourseAssessment,
  type Proficiency,
} from '@/data/courseAdvisorData'
import {
  discussionQuestions,
  missingInfo,
  scoreBranches,
  suggestedNextSteps,
  type BranchScore,
} from '@/utils/courseAdvisorEngine'
import { explainRecommendations } from '@/services/courseAdvisorApi'
import type { TranslationKey } from '@/locales/en'

interface CollegeEntry {
  id: string
  name: string
  location: string
  branches: string
  tuition: string
  source: string
}
interface NextStep {
  id: string
  text: string
  done: boolean
}
interface Persisted {
  assessment: CourseAssessment
  colleges: CollegeEntry[]
  nextSteps: NextStep[]
}

const STORAGE_KEY = 'edumitra.courseAdvisor'

const proficiencyOptions: { value: Proficiency; key: string }[] = [
  { value: 'strong', key: 'prof.strong' },
  { value: 'average', key: 'prof.average' },
  { value: 'weak', key: 'prof.weak' },
  { value: 'unknown', key: 'prof.unknown' },
]
const collegeTypeOptions: { value: CollegeType; key: string }[] = [
  { value: 'government', key: 'collegeType.government' },
  { value: 'private', key: 'collegeType.private' },
  { value: 'either', key: 'collegeType.either' },
]

const steps: { key: string }[] = [
  { key: 'interests' },
  { key: 'academics' },
  { key: 'budget' },
  { key: 'recommendations' },
  { key: 'compare' },
  { key: 'colleges' },
  { key: 'report' },
]

function loadState(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Persisted
  } catch {
    /* ignore */
  }
  return {
    assessment: emptyAssessment,
    colleges: [],
    nextSteps: suggestedNextSteps().map((text, i) => ({ id: `ns-${i}`, text, done: false })),
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function CourseAdvisorPage() {
  const { t } = useLanguage()
  const [persisted, setPersisted] = useState<Persisted>(loadState)
  const [step, setStep] = useState(0)
  const [compare, setCompare] = useState<string[]>([])
  const [ai, setAi] = useState<{ loading: boolean; source?: 'ai' | 'fallback'; summary?: string; error?: boolean }>({
    loading: false,
  })
  const [collegeForm, setCollegeForm] = useState({ name: '', location: '', branches: '', tuition: '', source: '' })
  const [newStep, setNewStep] = useState('')

  const { assessment, colleges, nextSteps } = persisted

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      /* ignore */
    }
  }, [persisted])

  const patchAssessment = (patch: Partial<CourseAssessment>) =>
    setPersisted((p) => ({ ...p, assessment: { ...p.assessment, ...patch } }))

  const toggleArr = (
    key: 'favouriteSubjects' | 'interests' | 'strengths' | 'careerGoals' | 'preferredBranches',
    value: string,
  ) =>
    setPersisted((p) => {
      const arr = p.assessment[key]
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
      return { ...p, assessment: { ...p.assessment, [key]: next } }
    })

  const scores = useMemo<BranchScore[]>(() => scoreBranches(assessment), [assessment])
  const missing = useMemo(() => missingInfo(assessment), [assessment])
  const questions = useMemo(() => discussionQuestions(assessment), [assessment])

  const annualBudget = Number(assessment.annualTuitionBudget)
  const hasBudget = Boolean(assessment.annualTuitionBudget) && !Number.isNaN(annualBudget)

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]))

  const runAi = async () => {
    setAi({ loading: true })
    const top = scores.slice(0, 3).map((s) => ({ name: s.name, score: s.score, reasons: s.reasons }))
    try {
      const res = await explainRecommendations({
        assessment: {
          favouriteSubjects: assessment.favouriteSubjects,
          interests: assessment.interests,
          strengths: assessment.strengths,
          careerGoals: assessment.careerGoals,
          preferredBranches: assessment.preferredBranches,
          mathPerformance: assessment.mathPerformance,
          physicsPerformance: assessment.physicsPerformance,
          chemistryPerformance: assessment.chemistryPerformance,
        },
        topBranches: top,
      })
      setAi({ loading: false, source: res.source, summary: res.summary })
    } catch {
      setAi({ loading: false, error: true })
    }
  }

  const addCollege = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (!collegeForm.name.trim()) return
    setPersisted((p) => ({
      ...p,
      colleges: [...p.colleges, { ...collegeForm, id: uid('col') }],
    }))
    setCollegeForm({ name: '', location: '', branches: '', tuition: '', source: '' })
  }

  const addNextStep = () => {
    if (!newStep.trim()) return
    setPersisted((p) => ({ ...p, nextSteps: [...p.nextSteps, { id: uid('ns'), text: newStep.trim(), done: false }] }))
    setNewStep('')
  }
  const toggleNextStep = (id: string) =>
    setPersisted((p) => ({
      ...p,
      nextSteps: p.nextSteps.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    }))
  const deleteNextStep = (id: string) =>
    setPersisted((p) => ({ ...p, nextSteps: p.nextSteps.filter((s) => s.id !== id) }))

  const renderStep = () => {
    switch (steps[step].key) {
      case 'interests':
        return (
          <Card>
            <Field label={t('courseAdvisor.favouriteSubjects')}>
              <ChipSelect
                options={subjectOptions.map((s) => ({ value: s, label: s }))}
                selected={assessment.favouriteSubjects}
                onToggle={(v) => toggleArr('favouriteSubjects', v)}
              />
            </Field>
            <Field label={t('courseAdvisor.interests')}>
              <ChipSelect
                options={interestOptions.map((o) => ({ value: o.value, label: t(o.labelKey as TranslationKey) }))}
                selected={assessment.interests}
                onToggle={(v) => toggleArr('interests', v)}
              />
            </Field>
            <Field label={t('courseAdvisor.strengths')}>
              <ChipSelect
                options={subjectOptions.map((s) => ({ value: s, label: s }))}
                selected={assessment.strengths}
                onToggle={(v) => toggleArr('strengths', v)}
              />
            </Field>
            <Field label={t('courseAdvisor.careerGoals')}>
              <ChipSelect
                options={careerGoalOptions.map((c) => ({ value: c, label: c }))}
                selected={assessment.careerGoals}
                onToggle={(v) => toggleArr('careerGoals', v)}
              />
            </Field>
            <Field label={t('courseAdvisor.preferredBranches')}>
              <ChipSelect
                options={branches.map((b) => ({ value: b.id, label: b.short }))}
                selected={assessment.preferredBranches}
                onToggle={(v) => toggleArr('preferredBranches', v)}
              />
            </Field>
          </Card>
        )
      case 'academics':
        return (
          <Card>
            <div className="grid gap-x-4 sm:grid-cols-3">
              <Field label={t('courseAdvisor.math')} htmlFor="math">
                <Select id="math" value={assessment.mathPerformance} onChange={(e) => patchAssessment({ mathPerformance: e.target.value as Proficiency })}>
                  {proficiencyOptions.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key as TranslationKey)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t('courseAdvisor.physics')} htmlFor="physics">
                <Select id="physics" value={assessment.physicsPerformance} onChange={(e) => patchAssessment({ physicsPerformance: e.target.value as Proficiency })}>
                  {proficiencyOptions.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key as TranslationKey)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t('courseAdvisor.chemistry')} htmlFor="chemistry">
                <Select id="chemistry" value={assessment.chemistryPerformance} onChange={(e) => patchAssessment({ chemistryPerformance: e.target.value as Proficiency })}>
                  {proficiencyOptions.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key as TranslationKey)}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-x-4 sm:grid-cols-3">
              <Field label={t('courseAdvisor.entranceExam')} htmlFor="exam">
                <Input id="exam" value={assessment.entranceExamName} onChange={(e) => patchAssessment({ entranceExamName: e.target.value })} placeholder="JEE / EAMCET / other" />
              </Field>
              <Field label={t('courseAdvisor.entranceScore')} htmlFor="score">
                <Input id="score" value={assessment.entranceScore} onChange={(e) => patchAssessment({ entranceScore: e.target.value })} placeholder="score or rank" />
              </Field>
              <Field label={t('courseAdvisor.examYear')} htmlFor="year">
                <Input id="year" value={assessment.examYear} onChange={(e) => patchAssessment({ examYear: e.target.value })} placeholder="2026" />
              </Field>
            </div>
          </Card>
        )
      case 'budget':
        return (
          <Card>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label={t('courseAdvisor.annualBudget')} htmlFor="annual" hint="Per year, in INR">
                <Input id="annual" type="number" min={0} value={assessment.annualTuitionBudget} onChange={(e) => patchAssessment({ annualTuitionBudget: e.target.value })} placeholder="120000" />
              </Field>
              <Field label={t('courseAdvisor.totalBudget')} htmlFor="total" hint="Full degree, in INR (optional)">
                <Input id="total" type="number" min={0} value={assessment.totalBudget} onChange={(e) => patchAssessment({ totalBudget: e.target.value })} placeholder="600000" />
              </Field>
              <Field label={t('courseAdvisor.location')} htmlFor="location">
                <Input id="location" value={assessment.preferredLocation} onChange={(e) => patchAssessment({ preferredLocation: e.target.value })} placeholder="City or state" />
              </Field>
              <Field label={t('courseAdvisor.collegeType')} htmlFor="ctype">
                <Select id="ctype" value={assessment.collegeType} onChange={(e) => patchAssessment({ collegeType: e.target.value as CollegeType })}>
                  {collegeTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key as TranslationKey)}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={assessment.hostelPreferred} onChange={(e) => patchAssessment({ hostelPreferred: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                {t('courseAdvisor.hostel')}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={assessment.willingToRelocate} onChange={(e) => patchAssessment({ willingToRelocate: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                {t('courseAdvisor.relocate')}
              </label>
            </div>
          </Card>
        )
      case 'recommendations': {
        if (!assessment.interests.length || !assessment.favouriteSubjects.length) {
          return <EmptyState icon={<Info size={26} aria-hidden />} title={t('courseAdvisor.assessmentIncomplete')} />
        }
        return (
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-ink-muted">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden /> {t('courseAdvisor.heuristicNote')}
            </p>
            {scores.slice(0, 5).map((s) => (
              <Card key={s.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-ink">{s.name}</h3>
                    <p className="text-xs text-ink-subtle">{s.branch.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="blue">{t('courseAdvisor.matchScore')}: {s.score}/100</Badge>
                    <Button size="sm" variant={compare.includes(s.id) ? 'primary' : 'outline'} onClick={() => toggleCompare(s.id)} aria-pressed={compare.includes(s.id)}>
                      {compare.includes(s.id) ? '✓' : '+'}
                    </Button>
                  </div>
                </div>
                <ProgressBar className="mt-3" value={s.score} tone="blue" />
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('courseAdvisor.why')}</p>
                  <ul className="mt-1 space-y-1">
                    {s.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-ink">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden /> {r}
                      </li>
                    ))}
                    {s.tradeOff ? (
                      <li className="flex items-start gap-2 text-sm text-amber-700">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden /> {s.tradeOff}
                      </li>
                    ) : null}
                  </ul>
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('courseAdvisor.keySkills')}</p>
                    <p className="mt-1 text-sm text-ink-muted">{s.branch.keySkills.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('courseAdvisor.subjects')}</p>
                    <p className="mt-1 text-sm text-ink-muted">{s.branch.subjectsStudied.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('courseAdvisor.careerPaths')}</p>
                    <p className="mt-1 text-sm text-ink-muted">{s.branch.careerPaths.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('courseAdvisor.roles')}</p>
                    <p className="mt-1 text-sm text-ink-muted">{s.branch.roles.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{t('courseAdvisor.pros')}</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                      {s.branch.pros.map((p) => <li key={p}>+ {p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{t('courseAdvisor.cons')}</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                      {s.branch.cons.map((c) => <li key={c}>– {c}</li>)}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}

            <Card>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.aiSummary')}</h3>
                <Button variant="outline" size="sm" onClick={runAi} disabled={ai.loading}>
                  <Sparkles size={14} aria-hidden /> {t('courseAdvisor.explainWithAi')}
                </Button>
              </div>
              {ai.loading ? (
                <p className="mt-3 text-sm text-ink-muted">{t('courseAdvisor.aiLoading')}</p>
              ) : null}
              {ai.summary ? (
                <div className="mt-3">
                  <Badge tone={ai.source === 'ai' ? 'teal' : 'amber'}>
                    {ai.source === 'ai' ? t('courseAdvisor.aiSummary') : t('courseAdvisor.aiDemo')}
                  </Badge>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink">{ai.summary}</p>
                </div>
              ) : null}
              {ai.error ? (
                <p className="mt-3 text-sm text-red-600">{t('courseAdvisor.aiError')}</p>
              ) : null}
            </Card>
          </div>
        )
      }
      case 'compare': {
        const selected = branches.filter((b) => compare.includes(b.id))
        const selectedScores = scores.filter((s) => compare.includes(s.id))
        return (
          <div>
            <p className="mb-3 text-sm text-ink-muted">{t('courseAdvisor.selectToCompare')}</p>
            <ChipSelect
              options={branches.map((b) => ({ value: b.id, label: b.short }))}
              selected={compare}
              onToggle={toggleCompare}
            />
            {selected.length === 0 ? (
              <EmptyState className="mt-4" title={t('courseAdvisor.compareTitle')} />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-ink-subtle">
                      <th className="w-40 border-b border-line p-2"></th>
                      {selected.map((b) => (
                        <th key={b.id} className="border-b border-line p-2 text-ink">{b.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow label={t('courseAdvisor.matchScore')} values={selectedScores.map((s) => `${s.score}/100`)} />
                    <CompareRow label={t('courseAdvisor.subjects')} values={selected.map((b) => b.subjectsStudied.join(', '))} />
                    <CompareRow label={t('courseAdvisor.keySkills')} values={selected.map((b) => b.keySkills.join(', '))} />
                    <CompareRow label={t('courseAdvisor.careerPaths')} values={selected.map((b) => b.careerPaths.join(', '))} />
                    <CompareRow label={t('courseAdvisor.roles')} values={selected.map((b) => b.roles.join(', '))} />
                    <CompareRow label={t('courseAdvisor.pros')} values={selected.map((b) => b.pros.join('; '))} />
                    <CompareRow label={t('courseAdvisor.cons')} values={selected.map((b) => b.cons.join('; '))} />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      }
      case 'colleges': {
        const within = colleges.filter((c) => !hasBudget || Number(c.tuition || 0) <= annualBudget).length
        return (
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden /> {t('courseAdvisor.collegeVerifyHint')}
            </p>
            <Card>
              <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.addCollege')}</h3>
              <form onSubmit={addCollege} noValidate className="mt-4">
                <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label={t('courseAdvisor.collegeName')} htmlFor="cname" required>
                    <Input id="cname" value={collegeForm.name} onChange={(e) => setCollegeForm((f) => ({ ...f, name: e.target.value }))} />
                  </Field>
                  <Field label={t('courseAdvisor.collegeLocation')} htmlFor="cloc">
                    <Input id="cloc" value={collegeForm.location} onChange={(e) => setCollegeForm((f) => ({ ...f, location: e.target.value }))} />
                  </Field>
                  <Field label={t('courseAdvisor.collegeBranches')} htmlFor="cbr">
                    <Input id="cbr" value={collegeForm.branches} onChange={(e) => setCollegeForm((f) => ({ ...f, branches: e.target.value }))} placeholder="CSE, ECE, ..." />
                  </Field>
                  <Field label={t('courseAdvisor.collegeTuition')} htmlFor="ctui">
                    <Input id="ctui" type="number" min={0} value={collegeForm.tuition} onChange={(e) => setCollegeForm((f) => ({ ...f, tuition: e.target.value }))} />
                  </Field>
                  <Field label={t('courseAdvisor.collegeSource')} htmlFor="csrc">
                    <Input id="csrc" value={collegeForm.source} onChange={(e) => setCollegeForm((f) => ({ ...f, source: e.target.value }))} placeholder="official website, 2026" />
                  </Field>
                </div>
                <Button type="submit"><Plus size={16} aria-hidden /> {t('common.add')}</Button>
              </form>
            </Card>

            {colleges.length > 0 ? (
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.collegesTitle')}</h3>
                  {hasBudget ? (
                    <Badge tone="green">{t('courseAdvisor.withinBudget')}: {within}/{colleges.length}</Badge>
                  ) : null}
                </div>
                <ul className="mt-4 space-y-2">
                  {colleges.map((c) => {
                    const over = hasBudget && Number(c.tuition || 0) > annualBudget
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                        <div>
                          <p className="text-sm font-medium text-ink">{c.name}</p>
                          <p className="text-xs text-ink-subtle">
                            {[c.location, c.branches, c.tuition ? `₹${c.tuition}/yr` : ''].filter(Boolean).join(' · ')}
                          </p>
                          {c.source ? <p className="text-xs text-ink-subtle">{c.source}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasBudget ? (
                            <Badge tone={over ? 'red' : 'green'}>{over ? t('courseAdvisor.overBudget') : t('courseAdvisor.withinBudget')}</Badge>
                          ) : null}
                          <button type="button" onClick={() => setPersisted((p) => ({ ...p, colleges: p.colleges.filter((x) => x.id !== c.id) }))} aria-label={t('common.delete')} className="text-slate-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            ) : (
              <EmptyState title={t('courseAdvisor.noColleges')} />
            )}
          </div>
        )
      }
      case 'report': {
        const top3 = scores.slice(0, 3)
        return (
          <div className="space-y-4">
            <Card>
              <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.reportProfile')}</h3>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                <li><span className="text-ink-subtle">{t('courseAdvisor.favouriteSubjects')}:</span> {assessment.favouriteSubjects.join(', ') || '—'}</li>
                <li><span className="text-ink-subtle">{t('courseAdvisor.interests')}:</span> {assessment.interests.join(', ') || '—'}</li>
                <li><span className="text-ink-subtle">{t('courseAdvisor.careerGoals')}:</span> {assessment.careerGoals.join(', ') || '—'}</li>
                <li><span className="text-ink-subtle">{t('courseAdvisor.math')} / {t('courseAdvisor.physics')} / {t('courseAdvisor.chemistry')}:</span> {assessment.mathPerformance} / {assessment.physicsPerformance} / {assessment.chemistryPerformance}</li>
                <li><span className="text-ink-subtle">{t('courseAdvisor.entranceExam')}:</span> {assessment.entranceExamName ? `${assessment.entranceExamName} ${assessment.entranceScore} (${assessment.examYear})` : '—'}</li>
              </ul>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.reportRecommendations')}</h3>
              <ul className="mt-2 space-y-3">
                {top3.map((s) => (
                  <li key={s.id} className="rounded-lg border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{s.name}</p>
                      <Badge tone="blue">{s.score}/100</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{s.reasons.join('. ')}.</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.reportBudget')}</h3>
              <p className="mt-2 text-sm text-ink-muted">
                {hasBudget
                  ? `${t('courseAdvisor.annualBudget')}: ₹${annualBudget.toLocaleString('en-IN')} / yr. ${colleges.length} college(s) added — ${colleges.filter((c) => Number(c.tuition || 0) <= annualBudget).length} within budget.`
                  : `${t('courseAdvisor.annualBudget')}: —. ${t('courseAdvisor.collegeVerifyHint')}`}
              </p>
            </Card>

            {missing.length > 0 ? (
              <Card>
                <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.reportMissing')}</h3>
                <p className="mt-2 text-sm text-ink-muted">{missing.join(', ')}</p>
              </Card>
            ) : null}

            <Card>
              <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.reportQuestions')}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {questions.map((q) => <li key={q}>{q}</li>)}
              </ul>
            </Card>

            <Card>
              <h3 className="text-base font-semibold text-ink">{t('courseAdvisor.reportNextSteps')}</h3>
              <ul className="mt-3 space-y-2">
                {nextSteps.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => toggleNextStep(s.id)} className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-left hover:bg-slate-50">
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', s.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white')}>
                        {s.done ? <CheckCircle2 size={14} aria-hidden /> : null}
                      </span>
                      <span className={cn('flex-1 text-sm', s.done ? 'text-ink-subtle line-through' : 'text-ink')}>{s.text}</span>
                      <span onClick={(e) => { e.stopPropagation(); deleteNextStep(s.id) }} role="button" tabIndex={0} aria-label={t('common.delete')} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={15} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Input value={newStep} onChange={(e) => setNewStep(e.target.value)} placeholder={t('courseAdvisor.addNextStep')} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNextStep() } }} />
                <Button type="button" variant="outline" onClick={addNextStep}><Plus size={16} aria-hidden /> {t('common.add')}</Button>
              </div>
            </Card>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div>
      <PageHeader
        title={t('courseAdvisor.heading')}
        subtitle={t('courseAdvisor.intro')}
        actions={<Badge tone="teal">Engineering Advisor</Badge>}
      />

      {/* Stepper */}
      <div className="mb-6 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2">
          {steps.map((s, i) => {
            const active = i === step
            return (
              <li key={s.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-blue-600 text-white' : 'bg-white text-ink-muted hover:bg-slate-100',
                  )}
                >
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-xs', active ? 'bg-white/20' : 'bg-slate-200 text-ink')}>{i + 1}</span>
                  {t(`courseAdvisor.step.${s.key}` as TranslationKey)}
                </button>
                {i < steps.length - 1 ? <span className="mx-1 text-slate-300" aria-hidden>›</span> : null}
              </li>
            )
          })}
        </ol>
      </div>

      {renderStep()}

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft size={16} aria-hidden /> {t('courseAdvisor.back')}
        </Button>
        <p className="text-xs text-ink-subtle"><Compass size={12} className="mr-1 inline" aria-hidden /> {t('courseAdvisor.localNote')}</p>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            {t('courseAdvisor.next')} <ArrowRight size={16} aria-hidden />
          </Button>
        ) : (
          <span className="h-10" />
        )}
      </div>
    </div>
  )
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="border-b border-line p-2 align-top font-medium text-ink-subtle">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="border-b border-line p-2 align-top text-ink">{v || '—'}</td>
      ))}
    </tr>
  )
}
