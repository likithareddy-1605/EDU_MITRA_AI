import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={<Compass size={28} aria-hidden />}
        title={t('common.notFound')}
        description={t('common.notFoundDesc')}
        action={<Button onClick={() => navigate('/')}>{t('roadmap.back')}</Button>}
      />
    </div>
  )
}
