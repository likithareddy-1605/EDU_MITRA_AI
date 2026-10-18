import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

/** Always-visible honesty banner: makes clear this is demo mode, not live data. */
export function DemoBanner() {
  const { t } = useLanguage()
  return (
    <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
      <p>{t('demo.banner')}</p>
    </div>
  )
}
