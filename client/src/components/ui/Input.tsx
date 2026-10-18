import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink placeholder:text-slate-400',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30',
        'disabled:bg-slate-50',
        className,
      )}
      {...rest}
    />
  )
}
