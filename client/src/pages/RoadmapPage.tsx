import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { useDemoAuth } from '@/hooks/useDemoAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { courseAdvisorExpectations, roadmapRegistry } from '@/app/roadmapRegistry'

/**
 * One honest "planned for milestone X" page used by every not-yet-built
 * feature route. It does NOT pretend the feature works — it states plainly
 * that it is on the roadmap and (for the Course Advisor) lists what to expect.
 */
export function RoadmapPage() {
  const { feature } = useParams()
  const { t } = useLanguage()
  const { user } = useDemoAuth()
  const navigate = useNavigate()
  const home = user?.role === 'parent' ? '/parent' : '/student'

  if (!feature || !roadmapRegistry[feature]) {
    return (
      <EmptyState
        icon={<Compass size={28} aria-hidden />}
        title={t('common.notFound')}
        description={t('common.notFoundDesc')}
        action={<Button onClick={() => navigate(home)}>{t('roadmap.back')}</Button>}
      />
    )
  }

  const entry = roadmapRegistry[feature]
  const title = t(entry.labelKey)

  return (
    <div className="mx-auto max-w-2xl">
      <Card padding="lg" className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Compass size={24} aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-ink">{title}</h1>
        <div className="mt-3 flex justify-center">
          <Badge tone="blue">
            {t('roadmap.milestoneLabel')}: {entry.milestone}
          </Badge>
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted">{t('roadmap.notYetImplemented')}</p>

        {feature === 'course-advisor' ? (
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-ink-muted">
            {courseAdvisorExpectations.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => navigate(home)}>
            <ArrowLeft size={16} aria-hidden />
            {t('roadmap.back')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
