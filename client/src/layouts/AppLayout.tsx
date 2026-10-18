import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  GraduationCap,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { DemoBanner } from '@/components/DemoBanner'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { parentNav, studentNav } from '@/app/navigation'
import type { AppUser } from '@/types'

/** Sidebar footer — shows real user profile + session status + sign out */
function SidebarFooter({
  user,
  isDemoMode,
  signOut,
}: {
  user: AppUser | null
  isDemoMode: boolean
  signOut: () => void
}) {
  const { t } = useLanguage()

  return (
    <div className="border-t border-slate-800 p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        {isDemoMode ? (
          <Badge tone="amber">{t('demo.label')}</Badge>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            <ShieldCheck size={12} className="text-emerald-400" aria-hidden />
            Verified Session
          </span>
        )}
      </div>

      <div className="mb-3">
        <p className="truncate text-sm font-semibold text-slate-100">
          {user?.displayName || (user?.role === 'parent' ? 'Parent User' : 'Student User')}
        </p>
        {user?.email && (
          <p className="truncate text-xs text-slate-400">
            {user.email}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-brand-navy-soft hover:text-white"
      >
        <LogOut size={16} aria-hidden />
        {t('nav.signOut')}
      </button>
    </div>
  )
}

/**
 * App shell shared by the student and parent areas.
 */
export function AppLayout() {
  const { user, isDemoMode, signOut } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = user?.role === 'parent' ? parentNav : studentNav
  const roleLabel = user?.role === 'parent' ? t('role.parent') : t('role.student')

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden">
      <DemoBanner />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-brand-navy text-slate-100 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <GraduationCap size={20} aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-semibold text-white">{t('app.name')}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-navy-soft hover:text-white lg:hidden touch-manipulation"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
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
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-medium transition-colors min-h-[44px] touch-manipulation',
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

        <SidebarFooter
          user={user}
          isDemoMode={isDemoMode}
          signOut={handleSignOut}
        />
      </aside>

      {/* Backdrop for the mobile drawer */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Main column */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-2 -ml-2 text-slate-600 hover:bg-slate-100 touch-manipulation lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            {!isDemoMode && (
              <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:flex">
                <CheckCircle2 size={12} className="text-blue-600" aria-hidden />
                Cloud Synced
              </span>
            )}
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex-1 px-3.5 py-5 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
