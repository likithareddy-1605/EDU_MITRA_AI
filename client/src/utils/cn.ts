// Tiny className helper. We avoid adding clsx/tailwind-merge as dependencies
// for this milestone; a small joiner is enough and keeps things beginner-friendly.
export type ClassValue = string | false | null | undefined

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
