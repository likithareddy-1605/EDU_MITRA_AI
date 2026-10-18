import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, Info, Users } from 'lucide-react'
import { useDemoAuth } from '@/hooks/useDemoAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { UserRole } from '@/types'

export function LandingPage() {
  const { user, signInAs } = useDemoAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // If a demo role is already chosen, skip straight to that dashboard.
  useEffect(() => {
    if (user) navigate(user.role === 'parent' ? '/parent' : '/student', { replace: true })
  }, [user, navigate])

  const enter = (role: UserRole) => {
    signInAs(role)
    navigate(role === 'parent' ? '/parent' : '/student')
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <GraduationCap size={20} aria-hidden />
          </span>
          <span className="text-lg font-semibold text-ink">{t('app.name')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        <section className="mt-6 text-center sm:mt-12">
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">{t('landing.title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted">{t('landing.subtitle')}</p>
        </section>

        <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>{t('landing.demoNotice')}</p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Card padding="lg" className="flex flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <GraduationCap size={24} aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">{t('role.student')}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-muted">{t('landing.studentCardDesc')}</p>
            <Button className="mt-5 w-full" size="lg" onClick={() => enter('student')}>
              {t('landing.continueAsStudent')}
              <ArrowRight size={18} aria-hidden />
            </Button>
          </Card>

          <Card padding="lg" className="flex flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Users size={24} aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">{t('role.parent')}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-muted">{t('landing.parentCardDesc')}</p>
            <Button variant="secondary" className="mt-5 w-full" size="lg" onClick={() => enter('parent')}>
              {t('landing.continueAsParent')}
              <ArrowRight size={18} aria-hidden />
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
}
