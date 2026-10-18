// Small formatting helpers shared across the app.

/** Format an ISO date as e.g. "22 Oct 2026". Falls back to the raw string. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Constrain a number to a range (used for progress percentages). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}


/** Split a comma-separated string into a trimmed, non-empty list. */
export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
