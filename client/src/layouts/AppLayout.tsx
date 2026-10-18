import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, Menu, X } from 'lucide-react'
import { useDemoAuth } from '@/hooks/useDemoAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { DemoBanner } from '@/components/DemoBanner'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { parentNav, studentNav } from '@/app/navigation'

/**
 * App shell shared by the student and parent areas: a navy sidebar with
 * role-based navigation, a sticky top bar with the language switcher, and an
 * <Outlet/> for the active route. Responsive: the sidebar becomes a slide-over
 * drawer on small screens.
 */
export function AppLayout() {
  const { user, signOut } = useDemoAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = user?.role === 'parent' ? parentNav : studentNav
  const roleLabel = user?.role === 'parent' ? t('role.parent') : t('role.student')

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-canvas">
      <DemoBanner />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-brand-navy text-slate-100 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <GraduationCap size={20} aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-white">{t('app.name')}</p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-brand-navy-soft hover:text-white',
                  )
                }
              >
                <Icon size={18} aria-hidden />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3">
            <Badge tone="amber">{t('demo.label')}</Badge>
          </div>
          <p className="mb-3 truncate text-sm text-slate-200">{user?.displayName}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-brand-navy-soft hover:text-white"
          >
            <LogOut size={16} aria-hidden />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Backdrop for the mobile drawer */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="text-slate-600 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
