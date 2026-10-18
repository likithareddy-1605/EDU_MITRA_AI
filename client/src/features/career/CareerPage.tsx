import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { readinessEstimate } from '@/utils/studentStats'
import { careers, type CareerPath } from '@/data/careers'
import { fetchCareerGuidance, type CareerGuidanceResponse } from '@/services/careerApi'
import { CheckCircle2 as CheckIcon, Target, Briefcase, TrendingUp, ClipboardList, Plus, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'

// Domain categories for filtering
const DOMAIN_GROUPS: Record<string, string[]> = {
  'Software & Data': ['swe', 'ds', 'ml'],
  'Infrastructure': ['devops'],
  'Management': ['pm'],
  'Security': ['security'],
}

const RESUME_KEY = 'edumitra.resumeChecklist'
interface ResumeItem { id: string; text: string; done: boolean }

const defaultResumeItems: string[] = [
  'Add CGPA and current semester to resume',
  'List 2–3 technical projects with GitHub links',
  'Include relevant technical skills and tools',
  'Add internship or research experience (if any)',
  'List certifications and online courses',
  'Proofread for grammar and spelling errors',
  'Get one senior/faculty review',
  'Save as PDF — ensure correct formatting',
]

function uid(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function loadResume(): ResumeItem[] {
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (raw) return JSON.parse(raw) as ResumeItem[]
  } catch { /* ignore */ }
  return defaultResumeItems.map((text, i) => ({ id: `r-${i}`, text, done: false }))
}

function saveResume(items: ResumeItem[]) {
  try { localStorage.setItem(RESUME_KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

export function CareerPage() {
  const { t } = useLanguage()
  const { data } = useStudentData()
  const { profile, goals, tasks } = data

  const readiness = useMemo(() => readinessEstimate(profile, goals), [profile, goals])

  // Student's current skills from planner subjects
  const studentSkills = useMemo(() => {
    const set = new Set<string>()
    tasks.forEach((tk) => set.add(tk.subject))
    goals.forEach((g) => {
      if (g.category === 'programming') set.add('Programming')
      if (g.category === 'project') set.add('System Design')
    })
    return set
  }, [tasks, goals])

  // Domain filter
  const [selectedDomain, setSelectedDomain] = useState('')
  const filteredCareers = useMemo(() => {
    if (!selectedDomain) return careers
    const ids = DOMAIN_GROUPS[selectedDomain] ?? []
    return careers.filter((c) => ids.includes(c.id))
  }, [selectedDomain])

  // Selected career
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null)
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  const toggleStep = (i: number) =>
    setDoneSteps((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })

  const matchedSkills = selectedCareer ? selectedCareer.requiredSkills.filter((s) => studentSkills.has(s)) : []
  const missingSkills = selectedCareer ? selectedCareer.requiredSkills.filter((s) => !studentSkills.has(s)) : []

  // AI guidance
  const [guidanceLoading, setGuidanceLoading] = useState(false)
  const [guidance, setGuidance] = useState<CareerGuidanceResponse | null>(null)
  const [guidanceError, setGuidanceError] = useState(false)

  const fetchGuidance = async () => {
    if (!selectedCareer) return
    setGuidanceLoading(true)
    setGuidanceError(false)
    try {
      const result = await fetchCareerGuidance({
        studentName: profile.displayName,
        branch: profile.branch,
        year: profile.year,
        cgpa: profile.cgpa,
        careerInterest: selectedCareer.title,
        currentSkills: [...studentSkills],
        targetRole: selectedCareer.roles[0],
      })
      setGuidance(result)
    } catch {
      setGuidanceError(true)
    } finally {
      setGuidanceLoading(false)
    }
  }

  // Resume checklist
  const [resume, setResume] = useState<ResumeItem[]>(() => { const r = loadResume(); saveResume(r); return r })
  const [newItem, setNewItem] = useState('')

  const toggleResume = (id: string) => {
    const next = resume.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    setResume(next); saveResume(next)
  }
  const deleteResume = (id: string) => {
    const next = resume.filter((r) => r.id !== id)
    setResume(next); saveResume(next)
  }
  const addResume = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (!newItem.trim()) return
    const next = [...resume, { id: uid(), text: newItem.trim(), done: false }]
    setResume(next); saveResume(next); setNewItem('')
  }

  const resumeDone = resume.filter((r) => r.done).length

  const careerMatchesInterest = (c: CareerPath) =>
    profile.careerInterests.some((ci) => ci.toLowerCase().includes(c.title.toLowerCase().split(' ')[0]))

  return (
    <div>
      <PageHeader
        title={t('career.title')}
        subtitle={t('career.subtitle')}
        actions={<Badge tone="teal">Career Roadmap</Badge>}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label={t('career.placementReadiness')} value={`${readiness}%`} tone="blue" icon={<TrendingUp size={20} aria-hidden />} />
        <StatCard label={t('career.resumeChecklist')} value={`${resumeDone}/${resume.length}`} tone="green" icon={<ClipboardList size={20} aria-hidden />} />
        <StatCard label={t('career.explorer')} value={`${careers.length} Paths`} tone="teal" icon={<Briefcase size={20} aria-hidden />} />
      </div>

      {/* Career Explorer */}
      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">{t('career.explorer')}</h2>
          <Select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            aria-label={t('career.filterDomain')}
            className="w-full sm:w-48"
          >
            <option value="">{t('career.allDomains')}</option>
            {Object.keys(DOMAIN_GROUPS).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCareers.map((c) => {
            const isSel = selectedCareer?.id === c.id
            const matches = careerMatchesInterest(c)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { setSelectedCareer(c); setDoneSteps(new Set()); setGuidance(null) }}
                className={cn(
                  'rounded-lg border p-4 text-left transition-all',
                  isSel ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-line bg-white hover:bg-slate-50',
                )}
                aria-pressed={isSel}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{c.title}</p>
                  {matches && <Badge tone="teal">{t('career.matchesInterest')}</Badge>}
                </div>
                <p className="mt-1 text-xs text-ink-muted">{c.description}</p>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Career Detail */}
      {selectedCareer ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* Skill Gap */}
            <Card>
              <h2 className="text-base font-semibold text-ink mb-3">{t('career.skillGap')} — {selectedCareer.title}</h2>
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle mb-1">{t('career.matched')}</p>
                {matchedSkills.length ? (
                  <ul className="space-y-1">
                    {matchedSkills.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-ink">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-ink-subtle">None detected from your study planner yet.</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle mb-1">{t('career.missing')}</p>
                {missingSkills.length ? (
                  <ul className="space-y-1">
                    {missingSkills.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-ink">
                        <Target size={14} className="text-amber-600" />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-emerald-600 font-medium">All required skills matched! 🎉</p>}
              </div>
              <p className="mt-4 text-[11px] text-ink-subtle">{t('common.localNote')}</p>
            </Card>

            {/* Roadmap */}
            <Card>
              <h2 className="text-base font-semibold text-ink mb-1">{t('career.roadmap')} — {selectedCareer.title}</h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('career.roles')}</p>
              <p className="mt-1 mb-4 text-sm text-ink-muted">{selectedCareer.roles.join(' · ')}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle mb-2">{t('career.steps')}</p>
              <ul className="space-y-2">
                {selectedCareer.steps.map((step, i) => (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => toggleStep(i)}
                      className="flex w-full items-center gap-2 rounded-lg border border-line p-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                        doneSteps.has(i) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                      )}>
                        {doneSteps.has(i) && <CheckIcon size={14} aria-hidden />}
                      </span>
                      <span className={cn('flex-1 text-sm', doneSteps.has(i) ? 'text-ink-subtle line-through' : 'text-ink')}>
                        {step}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* AI Guidance */}
          <Card className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-base font-semibold text-ink">{t('career.aiGuidanceTitle')}</h2>
                <p className="text-xs text-ink-muted">For: {selectedCareer.title} — personalized to your academic profile</p>
              </div>
              <Button variant="primary" onClick={fetchGuidance} disabled={guidanceLoading}>
                {guidanceLoading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> {t('career.getAiGuidance')}</>}
              </Button>
            </div>

            {guidanceError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <AlertCircle size={15} />
                Could not reach the API. Check that the backend server is running at the configured URL.
              </div>
            )}

            {guidance && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge tone={guidance.source === 'ai' ? 'teal' : 'amber'}>
                    {guidance.source === 'ai' ? 'Live AI Response' : 'Rule-based Guidance (Demo)'}
                  </Badge>
                </div>

                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-sm leading-relaxed text-blue-900">{guidance.personalizedAdvice}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle mb-2">{t('career.prioritySkills')}</p>
                    <ul className="space-y-1.5">
                      {guidance.prioritySkills.map((s) => (
                        <li key={s} className="flex items-center gap-2 text-sm text-ink">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle mb-2">{t('career.actionSteps')}</p>
                    <ul className="space-y-1.5">
                      {guidance.recommendedActions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink">
                          <span className="shrink-0 mt-0.5 font-semibold text-blue-600">{i + 1}.</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {guidance.recommendedResources.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle mb-2">{t('career.curatedResources')}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {guidance.recommendedResources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ink truncate">{r.title}</p>
                            <p className="text-xs text-ink-muted">{r.platform} · {r.type}</p>
                          </div>
                          <ExternalLink size={13} className="shrink-0 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!guidance && !guidanceLoading && !guidanceError && (
              <p className="text-sm text-ink-subtle">
                Click "Get Tailored Guidance" to receive personalized advice for {selectedCareer.title}.
              </p>
            )}
          </Card>
        </>
      ) : (
        <EmptyState className="mb-6" title={t('career.noCareerSelected')} />
      )}

      {/* Resume Checklist */}
      <Card className="mt-2">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-ink">{t('career.resumeChecklist')}</h2>
          <Badge tone={resumeDone === resume.length ? 'green' : 'amber'}>{resumeDone}/{resume.length}</Badge>
        </div>
        <div className="mb-3"><ProgressBar value={resume.length ? (resumeDone / resume.length) * 100 : 0} tone="green" /></div>
        <form onSubmit={addResume} noValidate className="mb-3 flex flex-col sm:flex-row gap-2">
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={t('career.addResumeItem')} aria-label={t('career.addResumeItem')} className="flex-1" />
          <Button type="submit" variant="outline" className="shrink-0"><Plus size={14} aria-hidden /> {t('common.add')}</Button>
        </form>
        <ul className="space-y-2">
          {resume.map((r) => (
            <li key={r.id}>
              <div className="flex items-center gap-2 rounded-lg border border-line p-2.5">
                <button
                  type="button"
                  onClick={() => toggleResume(r.id)}
                  className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', r.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white')}
                  aria-label={r.done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {r.done && <CheckIcon size={14} aria-hidden />}
                </button>
                <span className={cn('flex-1 text-sm', r.done ? 'text-ink-subtle line-through' : 'text-ink')}>{r.text}</span>
                <button type="button" onClick={() => deleteResume(r.id)} aria-label={t('common.delete')} className="text-slate-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-subtle">{t('common.localNote')}</p>
      </Card>
    </div>
  )
}
