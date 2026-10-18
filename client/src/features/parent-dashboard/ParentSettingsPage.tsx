import { useState } from 'react'
import { CheckCircle2, Globe, Settings, Shield, UserCircle } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import type { LanguageCode } from '@/types'

export function ParentSettingsPage() {
  const { t, lang, setLang } = useLanguage()
  const { data } = useStudentData()
  const { profile } = data

  const [milestoneNotif, setMilestoneNotif] = useState(true)
  const [goalNotif, setGoalNotif] = useState(true)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <PageHeader title={t('settings.parentTitle')} subtitle={t('settings.parentSubtitle')} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Language */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Globe size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('settings.languagePref')}</h2>
          </div>
          <p className="mb-3 text-sm text-ink-muted">{t('settings.languageDesc')}</p>
          <div className="flex gap-3">
            {(['en', 'te'] as LanguageCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  lang === code
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-line bg-white text-ink hover:bg-slate-50'
                }`}
              >
                {code === 'en' ? '🇬🇧 English' : '🇮🇳 తెలుగు'}
              </button>
            ))}
          </div>
        </Card>

        {/* Linked Student */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <UserCircle size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('settings.linkedStudent')}</h2>
          </div>
          <div className="rounded-lg border border-line bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-ink">{profile.displayName}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {profile.branch} · {profile.year} · {profile.college || 'College not set'}
            </p>
            <p className="mt-2 text-[11px] text-ink-subtle">
              In demo mode, the parent is linked to the same local student profile. In production, this relationship is established via a secure invite with Row Level Security.
            </p>
          </div>
        </Card>

        {/* Privacy & Permissions */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Shield size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">Access & Privacy</h2>
          </div>
          <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
            <strong>What parents can see:</strong> Shared goals, computed academic summary (CGPA/trend), achievements, and the family decision record. Private goals, personal notes, and the full academic details are controlled by the student.
          </div>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={milestoneNotif}
                onChange={(e) => setMilestoneNotif(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-ink">{t('settings.notificationMilestones')}</p>
                <p className="text-xs text-ink-muted">In-app only — no emails in demo mode.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={goalNotif}
                onChange={(e) => setGoalNotif(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-ink">Notify when student shares a new goal</p>
                <p className="text-xs text-ink-muted">You will see new shared goals when you next open the Family Dashboard.</p>
              </div>
            </label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button variant="outline" onClick={save}>{t('common.save')} Preferences</Button>
            {saved && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 size={15} />
                {t('settings.saveSuccess')}
              </div>
            )}
          </div>
        </Card>

        {/* About */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Settings size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">About EduMitra AI</h2>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">
            EduMitra AI is an AI-enabled family decision-support platform for engineering education. It helps students and families understand academic progress, explore career options, and make informed decisions together.
          </p>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-ink-subtle space-y-1">
            <p>Version: Demo (Milestone 4)</p>
            <p>Data storage: Browser localStorage only (demo mode)</p>
            <p>AI: Gemini 1.5 Flash via server-side API (optional)</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
