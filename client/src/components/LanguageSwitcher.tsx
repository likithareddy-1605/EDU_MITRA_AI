import { useLanguage } from '@/hooks/useLanguage'
import { cn } from '@/utils/cn'

/** English / Telugu toggle (Module H). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  return (
    <div
      className={cn('inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm', className)}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        className={cn(
          'rounded-md px-2.5 py-1 font-medium transition-colors',
          lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
        )}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('te')}
        className={cn(
          'rounded-md px-2.5 py-1 font-medium transition-colors',
          lang === 'te' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
        )}
        aria-pressed={lang === 'te'}
      >
        తె
      </button>
    </div>
  )
}
