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
    <Card padding="sm" className="h-full">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-1 text-lg sm:text-2xl font-semibold text-ink truncate">
            {value}
            {unit ? <span className="ml-1 text-xs sm:text-sm font-normal text-ink-subtle">{unit}</span> : null}
          </p>
          {hint ? <p className="mt-1 truncate text-[11px] sm:text-xs text-ink-subtle">{hint}</p> : null}
        </div>
        {icon ? (
          <span className={cn('flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg', iconWrap[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  )
}
