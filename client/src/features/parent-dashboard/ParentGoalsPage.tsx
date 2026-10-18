import { Target } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate } from '@/utils/format'
import type { BadgeTone } from '@/components/ui/Badge'
import type { GoalStatus } from '@/types'

const statusTone: Record<GoalStatus, BadgeTone> = {
  not_started: 'amber',
  in_progress: 'blue',
  completed: 'green',
}

const statusLabel: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export function ParentGoalsPage() {
  const { t } = useLanguage()
  const { data } = useStudentData()
  const { goals, profile } = data

  const sharedGoals = goals.filter((g) => g.shared)
  const completedCount = sharedGoals.filter((g) => g.status === 'completed').length

  return (
    <div>
      <PageHeader
        title={t('parentGoals.title')}
        subtitle={`${t('parentGoals.subtitle')} — ${profile.displayName}`}
      />

      {/* Privacy notice */}
      <div className="mb-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <Target size={14} className="mt-0.5 shrink-0" aria-hidden />
        <span>{t('parentGoals.privateNote')}</span>
      </div>

      {sharedGoals.length === 0 ? (
        <EmptyState
          icon={<Target size={28} aria-hidden />}
          title={t('parentGoals.noShared')}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              <strong>{sharedGoals.length}</strong> shared goal{sharedGoals.length !== 1 ? 's' : ''} ·{' '}
              <strong>{completedCount}</strong> completed
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedGoals.map((g) => (
              <Card key={g.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm font-semibold text-ink leading-snug">{g.title}</p>
                  <Badge tone={statusTone[g.status]}>{statusLabel[g.status]}</Badge>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
                    <span>Progress</span>
                    <span className="font-semibold tabular-nums">{g.progress}%</span>
                  </div>
                  <ProgressBar
                    value={g.progress}
                    tone={g.status === 'completed' ? 'green' : g.progress > 50 ? 'teal' : 'blue'}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-ink-subtle">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium capitalize">{g.category}</span>
                  {g.deadline && (
                    <span>Due: {formatDate(g.deadline)}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
