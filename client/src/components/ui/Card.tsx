import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg'
}

const padMap = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
} as const

/** A white surface card with a subtle border and shadow. */
export function Card({ children, className, padding = 'md', ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface shadow-sm',
        padMap[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
