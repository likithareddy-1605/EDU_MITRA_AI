import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30',
        className,
      )}
      {...rest}
    />
  )
}
