import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Globe, Monitor, RefreshCw, Settings, Shield, UserCircle, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useStudentData } from '@/hooks/useStudentData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import {
  fetchStudentParentLinks,
  respondStudentParentLink,
  type StudentParentRequest,
} from '@/services/parentStudentLink'
import type { LanguageCode } from '@/types'

type SettingsPrefs = {
  notifications: boolean
  autoShareGoals: boolean
}

const PREFS_KEY = 'edumitra.settingsPrefs'

function loadPrefs(): SettingsPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as SettingsPrefs
  } catch { /* ignore */ }
  return { notifications: true, autoShareGoals: false }
}

function savePrefs(p: SettingsPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

export function StudentSettingsPage() {
  const { t, lang, setLang } = useLanguage()
  const { user, isDemoMode } = useAuth()
  const { data, updateProfile, resetDemo } = useStudentData()
  const { profile } = data

  // Local form for quick profile update
  const [name, setName] = useState(profile.displayName)
  const [college, setCollege] = useState(profile.college)
  const [branch, setBranch] = useState(profile.branch)
  const [year, setYear] = useState(profile.year)
  const [profileSaved, setProfileSaved] = useState(false)

  // Parent links for real student account
  const [parentLinks, setParentLinks] = useState<StudentParentRequest[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)

  const loadLinks = useCallback(async () => {
    if (isDemoMode || !user?.id) return
    setLoadingLinks(true)
    const links = await fetchStudentParentLinks(user.id)
    setParentLinks(links)
    setLoadingLinks(false)
  }, [isDemoMode, user?.id])

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  const handleLinkAction = async (linkId: string, action: 'approved' | 'revoked') => {
    if (!user?.id) return
    await respondStudentParentLink(user.id, linkId, action)
    loadLinks()
  }

  const [prefs, setPrefs] = useState<SettingsPrefs>(loadPrefs)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const saveProfile = () => {
    updateProfile({ displayName: name.trim() || profile.displayName, college, branch, year })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const savePreferences = () => {
    savePrefs(prefs)
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2500)
  }

  const handleReset = () => {
    if (window.confirm(t('settings.resetDemoConfirm'))) {
      resetDemo()
    }
  }

  const handleExport = () => {
    const summary = {
      displayName: profile.displayName,
      branch: profile.branch,
      year: profile.year,
      college: profile.college,
      cgpa: profile.cgpa,
      currentGoal: profile.currentGoal,
      careerInterests: profile.careerInterests,
      academicInterests: profile.academicInterests,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edumitra-profile-${profile.displayName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

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

        {/* Profile Quick Update */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <UserCircle size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('settings.profileSection')}</h2>
          </div>
          <div className="space-y-3">
            <Field label={t('profile.displayName')}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('profile.college')}>
              <Input value={college} onChange={(e) => setCollege(e.target.value)} />
            </Field>
            <Field label={t('profile.branch')}>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} />
            </Field>
            <Field label={t('profile.year')}>
              <Select value={year} onChange={(e) => setYear(e.target.value)}>
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center gap-3 pt-1">
              <Button variant="primary" onClick={saveProfile}>
                {t('common.save')}
              </Button>
              {profileSaved && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={15} />
                  {t('profile.saved')}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Privacy & Sharing */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Shield size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('settings.sharingPref')}</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.autoShareGoals}
                onChange={(e) => setPrefs((p) => ({ ...p, autoShareGoals: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-ink">{t('settings.autoShareGoals')}</p>
                <p className="text-xs text-ink-muted">{t('settings.autoShareDesc')}</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => setPrefs((p) => ({ ...p, notifications: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-ink">{t('settings.studyReminders')}</p>
                <p className="text-xs text-ink-muted">In-app only — EduMitra does not send emails or push notifications in demo mode.</p>
              </div>
            </label>
            <div className="flex items-center gap-3 pt-1">
              <Button variant="outline" onClick={savePreferences}>
                {t('common.save')} Preferences
              </Button>
              {prefsSaved && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={15} />
                  {t('settings.saveSuccess')}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Parent & Family Access (Real Student Account Only) */}
        {!isDemoMode && user?.role === 'student' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Users size={18} aria-hidden />
                </span>
                <h2 className="text-base font-semibold text-ink">Parent Access & Permissions</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadLinks}
                disabled={loadingLinks}
                className="gap-1.5"
              >
                <RefreshCw size={13} className={loadingLinks ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>

            <p className="mb-4 text-xs text-ink-muted">
              Parents can only see your academic progress and goals that you mark as shared once you approve their request.
            </p>

            {parentLinks.length === 0 ? (
              <p className="text-xs text-ink-subtle">No parent accounts currently linked or requesting access.</p>
            ) : (
              <div className="space-y-3">
                {parentLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{link.parentName}</span>
                        <Badge tone={link.status === 'approved' ? 'green' : link.status === 'pending' ? 'amber' : 'neutral'}>
                          {link.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-muted">{link.parentEmail}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {link.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleLinkAction(link.id, 'approved')}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                      )}
                      {link.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLinkAction(link.id, 'revoked')}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Revoke Access
                        </Button>
                      )}
                      {link.status === 'revoked' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLinkAction(link.id, 'approved')}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Data Management */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Settings size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('settings.dataSection')}</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">
              All EduMitra data is stored locally in this browser in demo mode. No data is sent to a server.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Monitor size={14} aria-hidden />
                {t('settings.exportSummaryBtn')}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {t('settings.resetDemoBtn')}
              </Button>
            </div>
            <p className="text-xs text-ink-subtle">{t('common.localNote')}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
