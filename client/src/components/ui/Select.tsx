import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  )
}
