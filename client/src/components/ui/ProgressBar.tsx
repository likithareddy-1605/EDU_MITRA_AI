import { cn } from '@/utils/cn'

export type ProgressTone = 'blue' | 'teal' | 'green' | 'amber' | 'red'

const fillTone: Record<ProgressTone, string> = {
  blue: 'bg-blue-600',
  teal: 'bg-teal-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

export function ProgressBar({
  value,
  tone = 'blue',
  className,
}: {
  value: number
  tone?: ProgressTone
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all', fillTone[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
