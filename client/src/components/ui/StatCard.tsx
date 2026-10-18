import type { ReactNode } from 'react'
import { Card } from './Card'
import { cn } from '@/utils/cn'

type StatTone = 'blue' | 'teal' | 'green' | 'amber'

const iconWrap: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-700',
  teal: 'bg-teal-50 text-teal-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  hint,
  tone = 'blue',
}: {
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  hint?: string
  tone?: StatTone
}) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {value}
            {unit ? <span className="ml-1 text-sm font-normal text-ink-subtle">{unit}</span> : null}
          </p>
          {hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
        </div>
        {icon ? (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconWrap[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  )
}
