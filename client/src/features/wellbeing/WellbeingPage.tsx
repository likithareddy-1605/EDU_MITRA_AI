import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Coffee,
  Droplets,
  Eye,
  Flame,
  HeartPulse,
  Lightbulb,
  Monitor,
  Moon,
  RotateCcw,
  Smile,
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/utils/cn'

// Wellness log persisted to localStorage
const WELLNESS_KEY = 'edumitra.wellnessLog'
interface WellnessEntry {
  date: string
  studyHours: number
  screenHours: number
  waterGlasses: number
  mood: MoodKey
  breaksTaken: number
}

type MoodKey = 'great' | 'good' | 'neutral' | 'tired' | 'stressed'
interface TimerMode { label: string; seconds: number; color: string }

const TIMER_MODES: TimerMode[] = [
  { label: 'Focus (25m)', seconds: 25 * 60, color: 'text-blue-600' },
  { label: 'Short Break (5m)', seconds: 5 * 60, color: 'text-emerald-600' },
  { label: 'Eye Rest 20-20-20 (20s)', seconds: 20, color: 'text-teal-600' },
]

const MOODS: { key: MoodKey; emoji: string; label: string }[] = [
  { key: 'great', emoji: '🚀', label: 'Energized' },
  { key: 'good', emoji: '😊', label: 'Good / Focused' },
  { key: 'neutral', emoji: '😐', label: 'Okay / Neutral' },
  { key: 'tired', emoji: '😴', label: 'Tired / Drained' },
  { key: 'stressed', emoji: '😰', label: 'Overwhelmed' },
]

const HABITS = [
  {
    icon: <Clock size={18} className="text-blue-600" aria-hidden />,
    title: 'Pomodoro Study Sessions',
    detail: 'Study in 25-minute focused blocks, then take a 5-minute break. After 4 pomodoros, take a longer 20-30 min break.',
    tip: 'Use the Focus Timer above to track your sessions.',
  },
  {
    icon: <Eye size={18} className="text-teal-600" aria-hidden />,
    title: '20-20-20 Eye Rule',
    detail: 'Every 20 minutes, look at an object 20 feet (~6m) away for 20 seconds to reduce eye strain.',
    tip: 'Set the Eye Rest timer to remind yourself every 20 minutes.',
  },
  {
    icon: <Droplets size={18} className="text-cyan-600" aria-hidden />,
    title: 'Stay Hydrated',
    detail: 'Aim for 8 glasses of water per day. Dehydration reduces concentration by up to 13%. Keep a water bottle at your desk.',
    tip: 'Track your water intake in today\'s check-in below.',
  },
  {
    icon: <Moon size={18} className="text-indigo-600" aria-hidden />,
    title: 'Protect Your Sleep',
    detail: 'Engineering students need 7–9 hours of sleep for memory consolidation. Avoid all-nighters before exams — they impair recall.',
    tip: 'Avoid screens 30 minutes before bed and keep consistent sleep/wake times.',
  },
  {
    icon: <Coffee size={18} className="text-amber-600" aria-hidden />,
    title: 'Active Study Techniques',
    detail: 'Passive re-reading is ineffective. Use active recall, practice problems, and teach-back to a peer to strengthen memory.',
    tip: 'After each study session, close your notes and write down 5 key points from memory.',
  },
  {
    icon: <Monitor size={18} className="text-rose-600" aria-hidden />,
    title: 'Limit Recreational Screen Time',
    detail: 'Social media and YouTube consume large blocks of unintended time. Use website blockers during dedicated study hours.',
    tip: 'Track total daily screen hours vs. study hours in your daily check-in.',
  },
  {
    icon: <Flame size={18} className="text-orange-600" aria-hidden />,
    title: 'Maintain Physical Activity',
    detail: 'Even a 20-minute walk improves concentration, creativity, and mood. Physical activity reduces cortisol (stress hormone).',
    tip: 'Schedule at least 1 physical activity break per day, even just a walk.',
  },
  {
    icon: <Lightbulb size={18} className="text-yellow-600" aria-hidden />,
    title: 'Plan Tomorrow Tonight',
    detail: 'Before you sleep, write 3 key tasks for tomorrow. This primes your brain overnight and reduces morning decision fatigue.',
    tip: 'Use the Study Planner to schedule tasks for each day of the week.',
  },
]

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function loadTodayLog(): WellnessEntry | null {
  try {
    const today = toISODate(new Date())
    const raw = localStorage.getItem(WELLNESS_KEY)
    if (raw) {
      const entries = JSON.parse(raw) as WellnessEntry[]
      return entries.find((e) => e.date === today) ?? null
    }
  } catch { /* ignore */ }
  return null
}

function saveLog(entry: WellnessEntry) {
  try {
    const raw = localStorage.getItem(WELLNESS_KEY)
    const entries: WellnessEntry[] = raw ? JSON.parse(raw) : []
    const idx = entries.findIndex((e) => e.date === entry.date)
    if (idx >= 0) entries[idx] = entry
    else entries.push(entry)
    // Keep only last 30 days
    const sorted = entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
    localStorage.setItem(WELLNESS_KEY, JSON.stringify(sorted))
  } catch { /* ignore */ }
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function WellbeingPage() {
  const { t } = useLanguage()

  // --- Timer ---
  const [modeIdx, setModeIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES[0].seconds)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const switchMode = (idx: number) => {
    setModeIdx(idx)
    setTimeLeft(TIMER_MODES[idx].seconds)
    setRunning(false)
    setCompleted(false)
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setRunning(false)
            setCompleted(true)
            if (intervalRef.current) clearInterval(intervalRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const resetTimer = () => {
    setRunning(false)
    setTimeLeft(TIMER_MODES[modeIdx].seconds)
    setCompleted(false)
  }

  const mm = Math.floor(timeLeft / 60)
  const ss = timeLeft % 60
  const total = TIMER_MODES[modeIdx].seconds
  const pct = total > 0 ? ((total - timeLeft) / total) * 100 : 0

  // --- Wellness Log ---
  const today = toISODate(new Date())
  const savedLog = loadTodayLog()

  const [studyHours, setStudyHours] = useState(savedLog?.studyHours ?? 0)
  const [screenHours, setScreenHours] = useState(savedLog?.screenHours ?? 0)
  const [waterGlasses, setWaterGlasses] = useState(savedLog?.waterGlasses ?? 0)
  const [mood, setMood] = useState<MoodKey>(savedLog?.mood ?? 'neutral')
  const [logSaved, setLogSaved] = useState(false)

  const saveWellnessLog = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    saveLog({ date: today, studyHours, screenHours, waterGlasses, mood, breaksTaken: 0 })
    setLogSaved(true)
    setTimeout(() => setLogSaved(false), 3000)
  }

  return (
    <div>
      <PageHeader
        title={t('wellbeing.title')}
        subtitle={t('wellbeing.subtitle')}
        actions={<Badge tone="blue">Wellbeing Hub</Badge>}
      />

      {/* Disclaimer */}
      <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
        <span>{t('wellbeing.disclaimer')}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Focus & Break Timer */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Clock size={18} aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">{t('wellbeing.timerTitle')}</h2>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {TIMER_MODES.map((m, i) => (
              <button
                key={m.label}
                type="button"
                onClick={() => switchMode(i)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  modeIdx === i ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-line bg-white text-ink-muted hover:bg-slate-50'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Timer display */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" className="fill-none stroke-slate-100" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44"
                  className={cn('fill-none transition-all duration-1000', TIMER_MODES[modeIdx].color.replace('text', 'stroke'))}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
                />
              </svg>
              <div className="text-center">
                <p className={cn('text-3xl font-bold tabular-nums', TIMER_MODES[modeIdx].color)}>{pad2(mm)}:{pad2(ss)}</p>
                {completed && <p className="mt-1 text-xs font-medium text-emerald-600">Done! ✓</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={running ? 'outline' : 'primary'}
                onClick={() => setRunning((r) => !r)}
                disabled={completed}
              >
                {running ? t('wellbeing.pauseTimer') : t('wellbeing.startTimer')}
              </Button>
              <Button variant="outline" onClick={resetTimer} aria-label={t('wellbeing.resetTimer')}>
                <RotateCcw size={15} aria-hidden />
              </Button>
            </div>
          </div>
          <p className="text-xs text-ink-subtle text-center">{t('wellbeing.timerDesc')}</p>
        </Card>

        {/* Daily Check-in */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <HeartPulse size={18} aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">{t('wellbeing.dailyLogTitle')}</h2>
              <p className="text-xs text-ink-muted">{today}</p>
            </div>
          </div>

          <form onSubmit={saveWellnessLog} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">{t('wellbeing.studyHours')}</label>
                <input
                  type="number" min={0} max={24} step={0.5}
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">{t('wellbeing.screenHours')}</label>
                <input
                  type="number" min={0} max={24} step={0.5}
                  value={screenHours}
                  onChange={(e) => setScreenHours(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">{t('wellbeing.waterGlasses')}</label>
                <input
                  type="number" min={0} max={20}
                  value={waterGlasses}
                  onChange={(e) => setWaterGlasses(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Screen time vs study time insight */}
            {screenHours > 0 && studyHours > 0 && (
              <div className={cn(
                'rounded-lg p-2.5 text-xs',
                screenHours > studyHours * 1.5
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              )}>
                {screenHours > studyHours * 1.5
                  ? `⚠️ Screen time (${screenHours}h) is significantly higher than study time (${studyHours}h). Consider setting app limits.`
                  : `✓ Good balance: ${studyHours}h study vs ${screenHours}h screen time.`}
              </div>
            )}

            {/* Mood picker */}
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">{t('wellbeing.moodTitle')}</p>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMood(m.key)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors',
                      mood === m.key
                        ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                        : 'border-line bg-white text-ink-muted hover:bg-slate-50'
                    )}
                    aria-pressed={mood === m.key}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" className="flex-1">
                <Smile size={14} aria-hidden />
                {t('wellbeing.saveLog')}
              </Button>
              {logSaved && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={15} aria-hidden />
                  {t('wellbeing.logSaved')}
                </div>
              )}
            </div>
          </form>
          <p className="mt-3 text-[11px] text-ink-subtle">Wellness logs are saved locally in this browser.</p>
        </Card>
      </div>

      {/* Healthy Habits */}
      <Card className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Lightbulb size={18} aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">{t('wellbeing.habitsTitle')}</h2>
            <p className="text-xs text-ink-muted">{t('wellbeing.habitsDesc')}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HABITS.map((h, i) => (
            <div key={i} className="rounded-lg border border-line bg-white p-3">
              <div className="flex items-center gap-2 mb-2">
                {h.icon}
                <p className="text-xs font-semibold text-ink">{h.title}</p>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-muted">{h.detail}</p>
              <div className="mt-2 rounded-md bg-blue-50 px-2 py-1.5">
                <p className="text-[11px] font-medium text-blue-700">💡 {h.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
