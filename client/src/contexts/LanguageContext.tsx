// Provider component only — hook is in useLanguage.ts to satisfy HMR rules.
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from '@/locales/en'
import { te } from '@/locales/te'
import type { LanguageCode } from '@/types'
import type { TranslationKey } from '@/locales/en'

interface LanguageState {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (key: TranslationKey) => string
}

const dictionaries: Record<LanguageCode, typeof en> = { en, te }

// eslint-disable-next-line react-refresh/only-export-components -- intentional context export
export const LanguageContext = createContext<LanguageState | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem('edumitra.lang')
    return stored === 'te' ? 'te' : 'en'
  })

  useEffect(() => {
    localStorage.setItem('edumitra.lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: LanguageCode) => setLangState(next), [])

  const t = useCallback(
    (key: TranslationKey): string => dictionaries[lang][key] ?? en[key] ?? (key as string),
    [lang],
  )

  const value = useMemo<LanguageState>(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
