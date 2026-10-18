import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ChipOption {
  value: string
  label: ReactNode
}

/** Multi-select rendered as toggle chips. Controlled component. */
export function ChipSelect({
  options,
  selected,
  onToggle,
  className,
}: {
  options: ChipOption[]
  selected: string[]
  onToggle: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const active = selected.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            aria-pressed={active}
            className={cn(
              'rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors touch-manipulation active:scale-[0.98]',
              active
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-ink hover:bg-slate-50',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
