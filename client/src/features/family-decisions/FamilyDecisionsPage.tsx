/**
 * Family Decision Comparison — Module E
 *
 * Four-step guided workflow:
 *  1. Pick Branches  — choose 2–3 branches to compare
 *  2. Compare        — side-by-side table drawn from courseAdvisorData + student profile
 *  3. Preferences    — student and parent each record their preferred branch + notes
 *  4. Decision Record — save the final family decision, rationale, concerns, trade-offs
 *
 * Data sources (no duplication):
 *  - branches  →  @/data/courseAdvisorData
 *  - scoring   →  @/utils/courseAdvisorEngine  (scoreBranches)
 *  - student   →  StudentDataContext  (profile, academic interests, career interests)
 *  - decision  →  FamilyDecisionContext  (localStorage)
 *
 * No fabricated college fees, cutoffs or placement statistics.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  RotateCcw,
  Save,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useDemoAuth } from '@/hooks/useDemoAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { useFamilyDecision } from '@/hooks/useFamilyDecision'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { branches, type BranchInfo } from '@/data/courseAdvisorData'
import { scoreBranches, type BranchScore } from '@/utils/courseAdvisorEngine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a lightweight CourseAssessment proxy from the student's profile so
 *  we can reuse scoreBranches without duplicating scoring logic. */
function buildAssessmentFromProfile(
  profile: ReturnType<typeof useStudentData>['data']['profile'],
) {
  // Map careerInterests to the careerGoalOptions vocabulary used by courseAdvisorData
  const interestKeywords: Record<string, string> = {
    'software engineer': 'Software Development',
    'data scientist': 'Data & AI',
    software: 'Software Development',
    data: 'Data & AI',
    research: 'Research',
    design: 'Design',
    management: 'Management',
  }
  const careerGoals = profile.careerInterests
    .map((ci) => {
      const lower = ci.toLowerCase()
      for (const [kw, goal] of Object.entries(interestKeywords)) {
        if (lower.includes(kw)) return goal
      }
      return ''
    })
    .filter(Boolean)

  // Map academicInterests to interest tags
  const interestTagMap: Record<string, string> = {
    algorithms: 'programming',
    'machine learning': 'ai-data',
    'web development': 'programming',
    programming: 'programming',
    electronics: 'electronics',
    civil: 'civil',
    research: 'research',
    management: 'management',
    design: 'creativity',
    ai: 'ai-data',
    data: 'ai-data',
    mechanics: 'machines',
  }
  const interests = profile.academicInterests
    .map((ai) => {
      const lower = ai.toLowerCase()
      for (const [kw, tag] of Object.entries(interestTagMap)) {
        if (lower.includes(kw)) return tag
      }
      return ''
    })
    .filter(Boolean)

  return {
    favouriteSubjects: [] as string[],
    interests,
    strengths: [] as string[],
    careerGoals,
    preferredBranches: [] as string[],
    mathPerformance: 'unknown' as const,
    physicsPerformance: 'unknown' as const,
    chemistryPerformance: 'unknown' as const,
    entranceExamName: '',
    entranceScore: '',
    examYear: '',
    annualTuitionBudget: '',
    totalBudget: '',
    preferredLocation: '',
    collegeType: 'either' as const,
    hostelPreferred: false,
    willingToRelocate: true,
  }
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
const STEPS = [
  'decision.step.pick',
  'decision.step.compare',
  'decision.step.preferences',
  'decision.step.record',
] as const

function StepBar({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <ol className="mb-8 flex items-center gap-0 overflow-x-auto">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-ink-subtle',
                )}
              >
                {done ? <CheckCircle2 size={16} /> : i + 1}
              </span>
              <span
                className={cn(
                  'mt-1 hidden text-xs sm:block',
                  active ? 'font-semibold text-blue-700' : done ? 'text-emerald-700' : 'text-ink-subtle',
                )}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <span
                className={cn(
                  'mx-2 h-0.5 w-8 shrink-0 sm:w-12',
                  i < current ? 'bg-emerald-400' : 'bg-slate-200',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Branch Picker
// ---------------------------------------------------------------------------
function StepPick({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (id: string) => void
}) {
  const { t } = useLanguage()
  const MAX = 3

  return (
    <div>
      <h2 className="text-base font-semibold text-ink">{t('decision.pick.heading')}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t('decision.pick.hint')}</p>
      <p className="mt-1 text-xs text-ink-subtle">{t('decision.pick.maxHint')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((b) => {
          const isSel = selected.includes(b.id)
          const disabled = !isSel && selected.length >= MAX
          return (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(b.id)}
              aria-pressed={isSel}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                isSel
                  ? 'border-blue-500 bg-blue-50'
                  : disabled
                    ? 'cursor-not-allowed border-line bg-white opacity-40'
                    : 'border-line bg-white hover:bg-slate-50',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                  isSel ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white',
                )}
              >
                {isSel ? <CheckCircle2 size={13} aria-hidden /> : null}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{b.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{b.short}</p>
                <p className="mt-1 text-xs text-ink-subtle line-clamp-2">{b.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <p className="mt-3 text-xs text-blue-700">
          {t('decision.pick.selected')}: {selected.length}/{MAX}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Comparison Table
// ---------------------------------------------------------------------------

function ScoreChip({ value }: { value: number }) {
  const tone = value >= 60 ? 'teal' : value >= 30 ? 'amber' : 'neutral'
  return <Badge tone={tone}>{value}%</Badge>
}

function SubjectFitChip({ branch, profile }: { branch: BranchInfo; profile: { academicInterests: string[] } }) {
  const { t } = useLanguage()
  const hits = branch.subjectTags.filter((s) =>
    profile.academicInterests.some((ai) => ai.toLowerCase().includes(s.toLowerCase())),
  )
  return hits.length > 0 ? (
    <Badge tone="teal">{hits.join(', ')}</Badge>
  ) : (
    <span className="text-xs text-ink-subtle">{t('decision.compare.notAvailable')}</span>
  )
}

function StepCompare({
  selectedIds,
  scores,
  profile,
}: {
  selectedIds: string[]
  scores: BranchScore[]
  profile: ReturnType<typeof useStudentData>['data']['profile']
}) {
  const { t } = useLanguage()
  const selected = selectedIds.map((id) => scores.find((s) => s.id === id)).filter(Boolean) as BranchScore[]

  if (selectedIds.length < 2) {
    return <EmptyState icon={<Users size={28} />} title={t('decision.pick.noneSelected')} />
  }

  const rows: { labelKey: string; render: (s: BranchScore) => React.ReactNode }[] = [
    {
      labelKey: 'decision.compare.matchScore',
      render: (s) => (
        <div>
          <ScoreChip value={s.score} />
          {s.reasons.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {s.reasons.slice(0, 2).map((r) => (
                <li key={r} className="flex items-start gap-1 text-xs text-ink-muted">
                  <ChevronRight size={12} className="mt-0.5 shrink-0 text-blue-400" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    {
      labelKey: 'decision.compare.subjectFit',
      render: (s) => <SubjectFitChip branch={s.branch} profile={profile} />,
    },
    {
      labelKey: 'decision.compare.subjects',
      render: (s) =>
        s.branch.subjectsStudied.length > 0 ? (
          <ul className="space-y-0.5">
            {s.branch.subjectsStudied.slice(0, 4).map((sub) => (
              <li key={sub} className="text-xs text-ink-muted">
                • {sub}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-ink-subtle">{t('decision.compare.notAvailable')}</span>
        ),
    },
    {
      labelKey: 'decision.compare.careerAlignment',
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.branch.careerPaths.slice(0, 3).map((c) => (
            <Badge key={c} tone="blue">
              {c}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      labelKey: 'decision.compare.roles',
      render: (s) =>
        s.branch.roles.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {s.branch.roles.slice(0, 3).map((r) => (
              <Badge key={r} tone="neutral">
                {r}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-ink-subtle">{t('decision.compare.notAvailable')}</span>
        ),
    },
    {
      labelKey: 'decision.compare.keySkills',
      render: (s) => (
        <ul className="space-y-0.5">
          {s.branch.keySkills.slice(0, 4).map((sk) => (
            <li key={sk} className="text-xs text-ink-muted">
              • {sk}
            </li>
          ))}
        </ul>
      ),
    },
    {
      labelKey: 'decision.compare.pros',
      render: (s) => (
        <ul className="space-y-0.5">
          {s.branch.pros.slice(0, 3).map((p) => (
            <li key={p} className="flex items-start gap-1 text-xs text-emerald-700">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      ),
    },
    {
      labelKey: 'decision.compare.cons',
      render: (s) => (
        <ul className="space-y-0.5">
          {s.branch.cons.slice(0, 2).map((c) => (
            <li key={c} className="flex items-start gap-1 text-xs text-amber-700">
              <ChevronRight size={12} className="mt-0.5 shrink-0" />
              {c}
            </li>
          ))}
          {s.tradeOff && (
            <li className="flex items-start gap-1 text-xs text-red-600">
              <ChevronRight size={12} className="mt-0.5 shrink-0" />
              {s.tradeOff}
            </li>
          )}
        </ul>
      ),
    },
  ]

  return (
    <div>
      <h2 className="text-base font-semibold text-ink">{t('decision.compare.heading')}</h2>
      <p className="mt-1 text-xs text-ink-subtle">{t('decision.compare.scoreNote')}</p>

      {/* Mobile: cards stacked */}
      <div className="mt-4 lg:hidden space-y-4">
        {selected.map((s) => (
          <Card key={s.id}>
            <h3 className="text-sm font-semibold text-ink">{s.name}</h3>
            <div className="mt-1"><ScoreChip value={s.score} /></div>
            {rows.slice(1).map((row) => (
              <div key={row.labelKey} className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t(row.labelKey as Parameters<typeof t>[0])}</p>
                {row.render(s)}
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Desktop: comparison table */}
      <div className="mt-4 hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-36 py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle" />
              {selected.map((s) => (
                <th key={s.id} className="border-b border-line px-4 py-2 text-left">
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className="text-xs text-ink-subtle">{s.short}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.labelKey} className="border-b border-line last:border-0">
                <td className="py-3 pr-4 align-top text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  {t(row.labelKey as Parameters<typeof t>[0])}
                </td>
                {selected.map((s) => (
                  <td key={s.id} className="px-4 py-3 align-top">
                    {row.render(s)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Preferences
// ---------------------------------------------------------------------------
function PreferencePanel({
  idPrefix,
  title,
  icon,
  accentClass,
  preferredBranchId,
  notes,
  selectedBranches,
  onChangeBranch,
  onChangeNotes,
  noBranchesSelected,
}: {
  idPrefix: string
  title: string
  icon: React.ReactNode
  accentClass: string
  preferredBranchId: string
  notes: string
  selectedBranches: BranchInfo[]
  onChangeBranch: (id: string) => void
  onChangeNotes: (val: string) => void
  noBranchesSelected: boolean
}) {
  const { t } = useLanguage()
  return (
    <Card className={cn('border-l-4', accentClass)}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base font-semibold text-ink">{title}</h3>
      </div>
      {noBranchesSelected ? (
        <p className="mt-3 text-sm text-ink-subtle">{t('decision.pref.noBranchSelected')}</p>
      ) : (
        <div className="mt-4 space-y-4">
          <Field label={t('decision.pref.preferredBranch')} htmlFor={`pref-branch-${idPrefix}`}>
            <Select
              id={`pref-branch-${idPrefix}`}
              value={preferredBranchId}
              onChange={(e) => onChangeBranch(e.target.value)}
            >
              <option value="">{t('decision.record.chooseBranch')}</option>
              {selectedBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('decision.pref.notes')} htmlFor={`pref-notes-${idPrefix}`}>
            <Textarea
              id={`pref-notes-${idPrefix}`}
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder={t('decision.pref.notesPlaceholder')}
              rows={3}
            />
          </Field>
        </div>
      )}
    </Card>
  )
}

function StepPreferences({
  selectedIds,
}: {
  selectedIds: string[]
}) {
  const { t } = useLanguage()
  const { decision, updateDecision } = useFamilyDecision()
  const selectedBranches = selectedIds.map((id) => branches.find((b) => b.id === id)).filter(Boolean) as BranchInfo[]
  const noBranchesSelected = selectedIds.length < 2

  return (
    <div>
      <h2 className="text-base font-semibold text-ink">{t('decision.pref.heading')}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Each person records their own view. Preferences are distinct — neither overrides the other.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PreferencePanel
          idPrefix="student"
          title={t('decision.pref.studentSection')}
          icon={<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><BookOpen size={18} /></span>}
          accentClass="border-blue-400"
          preferredBranchId={decision.studentPreference.preferredBranchId}
          notes={decision.studentPreference.notes}
          selectedBranches={selectedBranches}
          noBranchesSelected={noBranchesSelected}
          onChangeBranch={(id) =>
            updateDecision({ studentPreference: { ...decision.studentPreference, preferredBranchId: id } })
          }
          onChangeNotes={(val) =>
            updateDecision({ studentPreference: { ...decision.studentPreference, notes: val } })
          }
        />
        <PreferencePanel
          idPrefix="parent"
          title={t('decision.pref.parentSection')}
          icon={<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><Users size={18} /></span>}
          accentClass="border-teal-400"
          preferredBranchId={decision.parentPreference.preferredBranchId}
          notes={decision.parentPreference.notes}
          selectedBranches={selectedBranches}
          noBranchesSelected={noBranchesSelected}
          onChangeBranch={(id) =>
            updateDecision({ parentPreference: { ...decision.parentPreference, preferredBranchId: id } })
          }
          onChangeNotes={(val) =>
            updateDecision({ parentPreference: { ...decision.parentPreference, notes: val } })
          }
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — Decision Record
// ---------------------------------------------------------------------------
function StepRecord({ selectedIds }: { selectedIds: string[] }) {
  const { t } = useLanguage()
  const { user } = useDemoAuth()
  const { decision, updateDecision } = useFamilyDecision()
  const [saved, setSaved] = useState(!!decision.savedAt)
  const [editing, setEditing] = useState(!decision.savedAt)

  const dashboardPath = user?.role === 'parent' ? '/parent' : '/student'
  const selectedBranches = selectedIds.map((id) => branches.find((b) => b.id === id)).filter(Boolean) as BranchInfo[]
  const chosenBranch = branches.find((b) => b.id === decision.finalBranchId) ?? null
  const studentChosenBranch = branches.find((b) => b.id === decision.studentPreference.preferredBranchId)
  const parentChosenBranch = branches.find((b) => b.id === decision.parentPreference.preferredBranchId)

  const handleSave = () => {
    if (!decision.finalBranchId) return
    const now = new Date().toISOString()
    updateDecision({ savedAt: now })
    setSaved(true)
    setEditing(false)
  }

  const handleEdit = () => {
    setEditing(true)
    setSaved(false)
  }

  const handleReset = () => {
    updateDecision({
      finalBranchId: '',
      rationale: '',
      concerns: '',
      tradeOffs: '',
      savedAt: null,
    })
    setSaved(false)
    setEditing(true)
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-ink">{t('decision.record.heading')}</h2>

      {/* Selected branches evaluated */}
      {selectedBranches.length > 0 && (
        <Card className="mt-4 border-slate-200 bg-slate-50/70">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            {t('decision.step.compare')} — {selectedBranches.length} {t('courseAdvisor.recommendationsTitle').toLowerCase()}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedBranches.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm"
              >
                <span className="font-semibold">{b.name}</span>
                <span className="text-ink-subtle">({b.short})</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Preference summary */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="border-l-4 border-blue-400">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{t('decision.record.studentChose')}</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {studentChosenBranch?.name ?? <span className="text-ink-subtle">{t('decision.pref.noPreference')}</span>}
          </p>
          {decision.studentPreference.notes && (
            <p className="mt-1 text-xs text-ink-muted italic">"{decision.studentPreference.notes}"</p>
          )}
        </Card>
        <Card className="border-l-4 border-teal-400">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{t('decision.record.parentChose')}</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {parentChosenBranch?.name ?? <span className="text-ink-subtle">{t('decision.pref.noPreference')}</span>}
          </p>
          {decision.parentPreference.notes && (
            <p className="mt-1 text-xs text-ink-muted italic">"{decision.parentPreference.notes}"</p>
          )}
        </Card>
      </div>

      {/* Decision form / saved view */}
      <Card className="mt-4">
        {saved && !editing ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={18} />
                <span className="text-sm font-semibold">{t('decision.record.saved')}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  {t('decision.record.edit')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw size={14} />
                  {t('decision.record.reset')}
                </Button>
              </div>
            </div>
            {decision.savedAt && (
              <p className="mt-1 text-xs text-ink-subtle">
                {t('decision.record.savedAt')}: {formatDate(decision.savedAt.slice(0, 10))}
              </p>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('decision.record.finalChoice')}</p>
                <p className="mt-1 text-base font-semibold text-blue-700">
                  {chosenBranch?.name ?? <span className="text-ink-subtle">{t('decision.record.notDecided')}</span>}
                </p>
                {chosenBranch && (
                  <p className="text-xs text-ink-muted">{chosenBranch.description}</p>
                )}
              </div>
              {decision.rationale && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('decision.record.rationale')}</p>
                  <p className="mt-1 text-sm text-ink">{decision.rationale}</p>
                </div>
              )}
              {decision.concerns && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('decision.record.concerns')}</p>
                  <p className="mt-1 text-sm text-ink">{decision.concerns}</p>
                </div>
              )}
              {decision.tradeOffs && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{t('decision.record.tradeoffs')}</p>
                  <p className="mt-1 text-sm text-ink">{decision.tradeOffs}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-4">
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <ArrowLeft size={16} />
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label={t('decision.record.chosenBranch')} htmlFor="final-branch">
              <Select
                id="final-branch"
                value={decision.finalBranchId}
                onChange={(e) => updateDecision({ finalBranchId: e.target.value })}
              >
                <option value="">{t('decision.record.chooseBranch')}</option>
                {selectedBranches.length > 0
                  ? selectedBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  : branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
              </Select>
            </Field>
            <Field label={t('decision.record.rationale')} htmlFor="rationale">
              <Textarea
                id="rationale"
                value={decision.rationale}
                onChange={(e) => updateDecision({ rationale: e.target.value })}
                placeholder={t('decision.record.rationaleHint')}
                rows={2}
              />
            </Field>
            <Field label={t('decision.record.concerns')} htmlFor="concerns">
              <Textarea
                id="concerns"
                value={decision.concerns}
                onChange={(e) => updateDecision({ concerns: e.target.value })}
                placeholder={t('decision.record.concernsHint')}
                rows={2}
              />
            </Field>
            <Field label={t('decision.record.tradeoffs')} htmlFor="tradeoffs">
              <Textarea
                id="tradeoffs"
                value={decision.tradeOffs}
                onChange={(e) => updateDecision({ tradeOffs: e.target.value })}
                placeholder={t('decision.record.tradeoffsHint')}
                rows={2}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={!decision.finalBranchId}>
                <Save size={14} aria-hidden />
                {t('decision.record.save')}
              </Button>
              {!decision.finalBranchId && (
                <span className="text-xs text-ink-subtle">
                  ({t('decision.record.chooseBranch')})
                </span>
              )}
              {saved && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function FamilyDecisionsPage() {
  const { t } = useLanguage()
  const { data } = useStudentData()
  const { decision, updateDecision } = useFamilyDecision()

  const [step, setStep] = useState(0)

  // Branch selection is kept in the context so it persists.
  const selectedIds = decision.selectedBranchIds

  const toggleBranch = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((b) => b !== id)
      : selectedIds.length < 3
        ? [...selectedIds, id]
        : selectedIds
    updateDecision({ selectedBranchIds: next })
  }

  // Build scores lazily using the existing engine.
  const assessment = useMemo(() => buildAssessmentFromProfile(data.profile), [data.profile])
  const scores = useMemo(() => scoreBranches(assessment), [assessment])

  const canAdvance = step === 0 ? selectedIds.length >= 2 : true
  const stepLabels = STEPS.map((k) => t(k))

  // Overall progress for the progress bar (based on decision completeness).
  const filledSteps = [
    selectedIds.length >= 2,
    true, // compare is always "done" once picked
    decision.studentPreference.preferredBranchId !== '' || decision.parentPreference.preferredBranchId !== '',
    !!decision.savedAt,
  ].filter(Boolean).length
  const overallProgress = Math.round((filledSteps / 4) * 100)

  return (
    <div>
      <PageHeader
        title={t('decision.title')}
        subtitle={t('decision.subtitle')}
        actions={<Badge tone="amber">{t('demo.label')}</Badge>}
      />

      {/* Privacy note */}
      <p className="mb-6 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-ink-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
        Student preferences and parent preferences are recorded separately. Neither automatically overrides the other.
      </p>

      {/* Overall progress */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-xs text-ink-subtle">
          <span>Overall progress</span>
          <span>{overallProgress}%</span>
        </div>
        <ProgressBar value={overallProgress} tone="teal" />
      </div>

      {/* Step indicator */}
      <StepBar current={step} total={STEPS.length} labels={stepLabels} />

      {/* Step content */}
      <div className="min-h-64">
        {step === 0 && <StepPick selected={selectedIds} onToggle={toggleBranch} />}
        {step === 1 && (
          <StepCompare selectedIds={selectedIds} scores={scores} profile={data.profile} />
        )}
        {step === 2 && <StepPreferences selectedIds={selectedIds} />}
        {step === 3 && <StepRecord selectedIds={selectedIds} />}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft size={16} aria-hidden />
          {t('decision.nav.back')}
        </Button>

        {step === 0 && !canAdvance && (
          <p className="text-xs text-ink-subtle">{t('decision.pick.noneSelected')}</p>
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            {t('decision.nav.next')}
            <ArrowRight size={16} aria-hidden />
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <ClipboardCheck size={16} />
            <span>Step 4 of 4 — save the decision above when ready</span>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-subtle">{t('decision.localNote')}</p>
    </div>
  )
}
