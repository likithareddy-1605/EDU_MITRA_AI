import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import type { UserRole } from '@/types'

type AuthMode = 'signin' | 'signup' | 'forgot'

export function LandingPage() {
  const { user, loading: authLoading, signIn, signUp, resetPassword, signInAsDemo } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [role, setRole] = useState<UserRole>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Redirect authenticated user: to onboarding if new/incomplete, else to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      if (user.onboardingCompleted === false) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate(user.role === 'parent' ? '/parent' : '/student', { replace: true })
      }
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (mode === 'forgot') {
      setLoading(true)
      const res = await resetPassword(email.trim())
      setLoading(false)
      if (res.success) {
        setSuccessMsg('Password reset instructions sent. Please check your inbox.')
      } else {
        setError(res.error || 'Failed to send reset instructions.')
      }
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (!displayName.trim()) {
        setError('Please enter your name.')
        return
      }

      setLoading(true)
      const res = await signUp(email.trim(), password, role, displayName.trim())
      setLoading(false)
      if (!res.success) {
        setError(res.error || 'Signup failed. Please try again.')
      }
      return
    }

    // mode === 'signin'
    setLoading(true)
    const res = await signIn(email.trim(), password)
    setLoading(false)
    if (!res.success) {
      setError(res.error || 'Invalid email or password.')
    }
  }

  // Quick fill helper for testing/evaluating without manual registration
  const fillSample = (targetRole: UserRole) => {
    setError(null)
    setSuccessMsg(null)
    if (targetRole === 'student') {
      setEmail('aarav_sharma_1792296044782@gmail.com')
      setPassword('Password123!')
      setRole('student')
      setMode('signin')
    } else {
      setEmail('parent_sharma_1792296072030@gmail.com')
      setPassword('Password123!')
      setRole('parent')
      setMode('signin')
    }
  }

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line bg-white/80 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <GraduationCap size={20} className="sm:hidden" aria-hidden />
            <GraduationCap size={22} className="hidden sm:block" aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="text-base sm:text-lg font-bold tracking-tight text-ink truncate block sm:inline">{t('app.name')}</span>
            <span className="ml-2 hidden rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 sm:inline">
              Engineering AI Mentor
            </span>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-3.5 py-6 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Hero Information */}
          <div className="lg:col-span-6 min-w-0">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink leading-tight">
              Empowering Student Success & Family Alignment
            </h1>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-ink-muted">
              EduMitra AI bridges students and parents with personalized engineering academic tracking,
              transparent goal alignment, career guidance, and AI-powered study assistance.
            </p>

            {/* Feature Highlights */}
            <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={16} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink">Strict Student-Parent Privacy</h2>
                  <p className="text-xs text-ink-muted">Row-Level Security (RLS) ensures students control what is shared with parents.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CheckCircle2 size={16} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink">Real Gemini Intelligence</h2>
                  <p className="text-xs text-ink-muted">AI Academic Advisor and Career Guidance powered directly by Google Gemini.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <CheckCircle2 size={16} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink">Multi-Role Architecture</h2>
                  <p className="text-xs text-ink-muted">Dedicated dashboards tailored specifically for engineering students and parents.</p>
                </div>
              </div>
            </div>

            {/* Fast Test Login Section for Judges */}
            <div className="mt-6 sm:mt-8 rounded-xl border border-line bg-slate-50 p-3.5 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Quick Evaluator Access
              </p>
              <p className="mt-1 text-xs text-ink-subtle">
                Click below to auto-fill verified Supabase test credentials, or use Demo Mode offline:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillSample('student')}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 touch-manipulation active:scale-[0.98]"
                >
                  Fill Student Login
                </button>
                <button
                  type="button"
                  onClick={() => fillSample('parent')}
                  className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-medium text-teal-700 shadow-sm transition hover:bg-teal-50 touch-manipulation active:scale-[0.98]"
                >
                  Fill Parent Login
                </button>
                <button
                  type="button"
                  onClick={() => signInAsDemo('student')}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 touch-manipulation active:scale-[0.98]"
                >
                  Offline Demo (Student)
                </button>
                <button
                  type="button"
                  onClick={() => signInAsDemo('parent')}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 touch-manipulation active:scale-[0.98]"
                >
                  Offline Demo (Parent)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 min-w-0">
            <Card padding="md" className="border-line shadow-lg p-4 sm:p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-line pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                    setSuccessMsg(null)
                  }}
                  className={`flex-1 pb-2 text-center text-sm font-semibold transition-colors ${
                    mode === 'signin'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                    setSuccessMsg(null)
                  }}
                  className={`flex-1 pb-2 text-center text-sm font-semibold transition-colors ${
                    mode === 'signup'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Status & Error Alerts */}
              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
                  <p>{error}</p>
                </div>
              )}

              {successMsg && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                  <p>{successMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                {/* Sign Up Role Selector */}
                {mode === 'signup' && (
                  <div>
                    <label className="text-xs font-semibold text-ink">Choose your role</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex flex-col items-center rounded-xl border p-3.5 text-center transition ${
                          role === 'student'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm'
                            : 'border-line bg-white text-ink-muted hover:border-slate-300'
                        }`}
                      >
                        <GraduationCap size={22} className={role === 'student' ? 'text-blue-600' : 'text-slate-400'} />
                        <span className="mt-1.5 text-xs font-semibold">Student</span>
                        <span className="text-[10px] text-ink-subtle">Engineering Learner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('parent')}
                        className={`flex flex-col items-center rounded-xl border p-3.5 text-center transition ${
                          role === 'parent'
                            ? 'border-teal-600 bg-teal-50/70 text-teal-900 shadow-sm'
                            : 'border-line bg-white text-ink-muted hover:border-slate-300'
                        }`}
                      >
                        <Users size={22} className={role === 'parent' ? 'text-teal-600' : 'text-slate-400'} />
                        <span className="mt-1.5 text-xs font-semibold">Parent</span>
                        <span className="text-[10px] text-ink-subtle">Family Supporter</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Display Name (Sign Up only) */}
                {mode === 'signup' && (
                  <Field label="Full Name" htmlFor="displayName" required>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={role === 'student' ? 'e.g. Aarav Sharma' : 'e.g. Mr. & Mrs. Sharma'}
                        className="pl-9"
                        required
                      />
                    </div>
                  </Field>
                )}

                {/* Email Field */}
                <Field label="Email Address" htmlFor="email" required>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </Field>

                {/* Password Field (for signin and signup) */}
                {mode !== 'forgot' && (
                  <Field label="Password" htmlFor="password" required>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                )}

                {/* Confirm Password (Sign Up only) */}
                {mode === 'signup' && (
                  <Field label="Confirm Password" htmlFor="confirmPassword" required>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 pr-10"
                        required
                      />
                    </div>
                  </Field>
                )}

                {/* Forgot Password Link */}
                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot')
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === 'forgot' && (
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin')
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : mode === 'signin' ? (
                    <span className="flex items-center justify-center gap-2">
                      Sign In to EduMitra
                      <ArrowRight size={16} />
                    </span>
                  ) : mode === 'signup' ? (
                    <span className="flex items-center justify-center gap-2">
                      Create {role === 'student' ? 'Student' : 'Parent'} Account
                      <ArrowRight size={16} />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Password Reset Link
                      <ArrowRight size={16} />
                    </span>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
