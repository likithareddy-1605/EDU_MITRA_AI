import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Compass, GraduationCap, RefreshCw, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudentData } from '@/hooks/useStudentData'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { PageHeader } from '@/components/ui/PageHeader'
import { splitList } from '@/utils/format'

export function ProfilePage() {
  const { t } = useLanguage()
  const { user, isDemoMode } = useAuth()
  const { data, updateProfile } = useStudentData()
  const p = data.profile

  const [form, setForm] = useState({
    displayName: p.displayName,
    branch: p.branch,
    year: p.year,
    college: p.college,
    currentGoal: p.currentGoal,
    preferredLearning: p.preferredLearning,
    academicInterests: p.academicInterests.join(', '),
    careerInterests: p.careerInterests.join(', '),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.displayName.trim()) e.displayName = t('common.required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (!validate()) return
    updateProfile({
      displayName: form.displayName.trim(),
      branch: form.branch.trim(),
      year: form.year.trim(),
      college: form.college.trim(),
      currentGoal: form.currentGoal.trim(),
      preferredLearning: form.preferredLearning.trim(),
      academicInterests: splitList(form.academicInterests),
      careerInterests: splitList(form.careerInterests),
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={onSubmit} noValidate>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label={t('profile.displayName')} htmlFor="displayName" required error={errors.displayName}>
                <Input id="displayName" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
              </Field>
              <Field label={t('profile.branch')} htmlFor="branch">
                <Input id="branch" value={form.branch} onChange={(e) => set('branch', e.target.value)} />
              </Field>
              <Field label={t('profile.year')} htmlFor="year">
                <Input id="year" value={form.year} onChange={(e) => set('year', e.target.value)} />
              </Field>
              <Field label={t('profile.college')} htmlFor="college">
                <Input id="college" value={form.college} onChange={(e) => set('college', e.target.value)} />
              </Field>
              <Field label={t('profile.currentGoal')} htmlFor="currentGoal" className="sm:col-span-2">
                <Input id="currentGoal" value={form.currentGoal} onChange={(e) => set('currentGoal', e.target.value)} />
              </Field>
              <Field label={t('profile.preferredLearning')} htmlFor="preferredLearning" className="sm:col-span-2">
                <Textarea
                  id="preferredLearning"
                  rows={2}
                  value={form.preferredLearning}
                  onChange={(e) => set('preferredLearning', e.target.value)}
                />
              </Field>
              <Field
                label={t('profile.academicInterests')}
                htmlFor="academicInterests"
                hint={t('profile.interestsHint')}
                className="sm:col-span-2"
              >
                <Input
                  id="academicInterests"
                  value={form.academicInterests}
                  onChange={(e) => set('academicInterests', e.target.value)}
                  placeholder="Algorithms, Machine Learning"
                />
              </Field>
              <Field
                label={t('profile.careerInterests')}
                htmlFor="careerInterests"
                hint={t('profile.interestsHint')}
                className="sm:col-span-2"
              >
                <Input
                  id="careerInterests"
                  value={form.careerInterests}
                  onChange={(e) => set('careerInterests', e.target.value)}
                  placeholder="Software Engineer, Data Scientist"
                />
              </Field>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Button type="submit">
                <Save size={16} aria-hidden /> {t('common.save')}
              </Button>
              {saved ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 size={16} aria-hidden /> {t('profile.saved')}
                </span>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">{t('profile.title')}</h2>
            {isDemoMode ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Demo Profile
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {user?.educationStage === 'planning' ? (
                  <>
                    <Compass size={12} /> Aspirant
                  </>
                ) : (
                  <>
                    <GraduationCap size={12} /> Enrolled
                  </>
                )}
              </span>
            )}
          </div>

          <dl className="mt-3 space-y-3 text-sm">
            {!isDemoMode && (
              <div>
                <dt className="text-ink-subtle">Education Stage</dt>
                <dd className="font-medium text-ink">
                  {user?.educationStage === 'planning'
                    ? 'Planning to Join Engineering'
                    : 'Already Studying Engineering'}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-ink-subtle">{t('profile.branch')}</dt>
              <dd className="text-ink">{p.branch || '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">{t('profile.year')}</dt>
              <dd className="text-ink">{p.year || '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">{t('profile.academicInterests')}</dt>
              <dd className="text-ink">{p.academicInterests.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">{t('profile.careerInterests')}</dt>
              <dd className="text-ink">{p.careerInterests.join(', ') || '—'}</dd>
            </div>
          </dl>

          {!isDemoMode ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <Link
                to="/onboarding"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-100 transition-colors"
              >
                <RefreshCw size={13} /> Update Education Stage / Re-run Setup
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-xs text-ink-subtle">{t('common.localNote')}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
