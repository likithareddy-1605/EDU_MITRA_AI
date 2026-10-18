import { useMemo } from 'react'
import { GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import {
  computeCgpa,
  computeSemesterGpas,
  computeSubjectAverages,
  topSubjects,
  bottomSubjects,
} from '@/utils/studentStats'

const GRADE_MEANINGS: { range: string; meaning: string; color: string }[] = [
  { range: '90–100', meaning: 'Outstanding (O) — 10 points', color: 'text-emerald-600' },
  { range: '80–89', meaning: 'Excellent (A+) — 9 points', color: 'text-green-600' },
  { range: '70–79', meaning: 'Very Good (A) — 8 points', color: 'text-teal-600' },
  { range: '60–69', meaning: 'Good (B+) — 7 points', color: 'text-blue-600' },
  { range: '50–59', meaning: 'Above Average (B) — 6 points', color: 'text-indigo-600' },
  { range: '45–49', meaning: 'Average (C) — 5 points', color: 'text-amber-600' },
  { range: 'Below 45', meaning: 'Below threshold — needs attention', color: 'text-red-600' },
]

export function ParentAcademicsPage() {
  const { t } = useLanguage()
  const { data } = useStudentData()
  const { profile, records } = data

  const cgpa = useMemo(() => computeCgpa(records), [records])
  const semesterGpas = useMemo(() => computeSemesterGpas(records), [records])
  const subjectAverages = useMemo(() => computeSubjectAverages(records), [records])
  const strengths = useMemo(() => topSubjects(subjectAverages, 3), [subjectAverages])
  const improvements = useMemo(() => bottomSubjects(subjectAverages, 3), [subjectAverages])

  const trend = semesterGpas.length >= 2
    ? semesterGpas[semesterGpas.length - 1].sgpa - semesterGpas[0].sgpa
    : 0

  // Group records by semester
  const bySemester = useMemo(() => {
    const map = new Map<number, typeof records>()
    records.forEach((r) => {
      if (!map.has(r.semester)) map.set(r.semester, [])
      map.get(r.semester)!.push(r)
    })
    return [...map.entries()].sort(([a], [b]) => a - b)
  }, [records])

  return (
    <div>
      <PageHeader
        title={t('parentAcademics.title')}
        subtitle={`${t('parentAcademics.subtitle')} — ${profile.displayName} · ${profile.branch} · ${profile.year}`}
      />

      {records.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={28} aria-hidden />}
          title={t('parentAcademics.noRecords')}
          description="The student has not added any academic records yet. Encourage them to add subject marks in their Academics page."
        />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Current CGPA" value={cgpa.toFixed(2)} tone="blue" icon={<GraduationCap size={20} aria-hidden />} />
            <StatCard label="Semesters Recorded" value={semesterGpas.length} tone="teal" icon={<GraduationCap size={18} aria-hidden />} />
            <StatCard label="Total Subjects" value={records.length} tone="green" icon={<GraduationCap size={18} aria-hidden />} />
            <StatCard
              label="Trend"
              value={trend > 0.1 ? '↑ Improving' : trend < -0.1 ? '↓ Declining' : '→ Stable'}
              tone={trend > 0.1 ? 'green' : trend < -0.1 ? 'amber' : 'blue'}
              icon={trend > 0.1 ? <TrendingUp size={20} aria-hidden /> : trend < -0.1 ? <TrendingDown size={20} aria-hidden /> : <Minus size={20} aria-hidden />}
            />
          </div>

          {/* Strengths & Improvement */}
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 mb-3">Strongest Subjects</h2>
              {strengths.length ? (
                <ul className="space-y-2">
                  {strengths.map((s) => (
                    <li key={s} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                      <span className="text-sm font-medium text-ink">{s}</span>
                      <Badge tone="green">Strong</Badge>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-subtle">Add more subject records to see strengths.</p>}
            </Card>
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 mb-3">Areas Needing Attention</h2>
              {improvements.length ? (
                <ul className="space-y-2">
                  {improvements.map((s) => (
                    <li key={s} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                      <span className="text-sm font-medium text-ink">{s}</span>
                      <Badge tone="amber">Needs Focus</Badge>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-subtle">No specific improvement areas detected.</p>}
            </Card>
          </div>

          {/* Semester breakdown table */}
          <Card className="mb-6">
            <h2 className="text-base font-semibold text-ink mb-4">{t('parentAcademics.subjectTable')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="pb-2 text-left text-xs font-semibold text-ink-muted">Semester</th>
                    <th className="pb-2 text-left text-xs font-semibold text-ink-muted">Subject</th>
                    <th className="pb-2 text-right text-xs font-semibold text-ink-muted">Marks</th>
                    <th className="pb-2 text-right text-xs font-semibold text-ink-muted">Grade</th>
                    <th className="pb-2 text-right text-xs font-semibold text-ink-muted">SGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {bySemester.map(([sem, recs]) => {
                    const sgpa = semesterGpas.find((s) => s.semester === sem)?.sgpa ?? null
                    return recs.map((r, i) => (
                      <tr key={r.id} className="border-b border-line/50 hover:bg-slate-50">
                        <td className="py-2 text-ink-muted">{i === 0 ? `Sem ${sem}` : ''}</td>
                        <td className="py-2 font-medium text-ink">{r.subject}</td>
                        <td className="py-2 text-right tabular-nums">{r.marks}</td>
                        <td className="py-2 text-right font-semibold text-ink">{r.grade}</td>
                        <td className="py-2 text-right tabular-nums text-ink-muted">{i === 0 && sgpa !== null ? sgpa.toFixed(2) : ''}</td>
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Grade guide */}
          <Card>
            <h2 className="text-base font-semibold text-ink mb-3">{t('parentAcademics.cgpaExplained')}</h2>
            <p className="mb-3 text-xs text-ink-muted">{t('parentAcademics.gradeMeaning')}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {GRADE_MEANINGS.map((g) => (
                <div key={g.range} className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2">
                  <span className="w-16 shrink-0 text-xs font-semibold text-ink-muted">{g.range}</span>
                  <span className={`text-xs font-medium ${g.color}`}>{g.meaning}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
