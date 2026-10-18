import { useMemo, useState } from 'react'
import { BookOpen, Bookmark, BookmarkCheck, ExternalLink, Search } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/ui/StatCard'
import {
  learningResources,
  resourceSubjects,
  resourceTypes,
  resourceLevels,
  type ResourceSubject,
  type ResourceType,
  type ResourceLevel,
} from '@/data/resources'
import { cn } from '@/utils/cn'

const BOOKMARKS_KEY = 'edumitra.resourceBookmarks'

function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveBookmarks(set: Set<string>) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]))
  } catch { /* ignore */ }
}

const levelColorMap: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
}

const typeColorMap: Record<string, string> = {
  'Video Course': 'bg-red-50 text-red-700 border-red-200',
  'Open Textbook': 'bg-amber-50 text-amber-700 border-amber-200',
  'Interactive Practice': 'bg-teal-50 text-teal-700 border-teal-200',
  'Reference / Docs': 'bg-slate-50 text-slate-600 border-slate-200',
  'MOOC': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'YouTube Playlist': 'bg-rose-50 text-rose-700 border-rose-200',
}

export function ResourcesPage() {
  const { t } = useLanguage()

  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<ResourceSubject | ''>('')
  const [type, setType] = useState<ResourceType | ''>('')
  const [level, setLevel] = useState<ResourceLevel | ''>('')
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks)

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveBookmarks(next)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return learningResources.filter((r) => {
      if (showBookmarksOnly && !bookmarks.has(r.id)) return false
      if (subject && r.subject !== subject) return false
      if (type && r.type !== type) return false
      if (level && r.level !== level) return false
      if (q) {
        const hay = [r.title, r.provider, r.subject, r.description, ...r.tags].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [search, subject, type, level, showBookmarksOnly, bookmarks])

  const freeCount = learningResources.filter((r) => r.isFree).length
  const bookmarkCount = bookmarks.size

  return (
    <div>
      <PageHeader
        title={t('resources.title')}
        subtitle={t('resources.subtitle')}
        actions={<Badge tone="teal">{learningResources.length} Resources</Badge>}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Resources"
          value={learningResources.length}
          tone="blue"
          icon={<BookOpen size={20} aria-hidden />}
        />
        <StatCard
          label={t('resources.freeBadge')}
          value={freeCount}
          tone="green"
          icon={<BookmarkCheck size={20} aria-hidden />}
        />
        <StatCard
          label={t('resources.savedBookmarks')}
          value={bookmarkCount}
          tone="teal"
          icon={<Bookmark size={20} aria-hidden />}
        />
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('resources.searchPlaceholder')}
              className="pl-9"
              aria-label="Search resources"
            />
          </div>
          <Select
            value={subject}
            onChange={(e) => setSubject(e.target.value as ResourceSubject | '')}
            aria-label={t('resources.filterSubject')}
            className="w-full sm:w-52"
          >
            <option value="">{t('resources.allSubjects')}</option>
            {resourceSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType | '')}
            aria-label={t('resources.filterType')}
            className="w-full sm:w-44"
          >
            <option value="">{t('resources.allTypes')}</option>
            {resourceTypes.map((tp) => (
              <option key={tp} value={tp}>{tp}</option>
            ))}
          </Select>
          <Select
            value={level}
            onChange={(e) => setLevel(e.target.value as ResourceLevel | '')}
            aria-label={t('resources.filterLevel')}
            className="w-full sm:w-40"
          >
            <option value="">{t('resources.allLevels')}</option>
            {resourceLevels.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </Select>
        </div>

        <button
          type="button"
          onClick={() => setShowBookmarksOnly((v) => !v)}
          className={cn(
            'mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            showBookmarksOnly
              ? 'border-teal-400 bg-teal-50 text-teal-700'
              : 'border-line bg-white text-ink-muted hover:bg-slate-50',
          )}
          aria-pressed={showBookmarksOnly}
        >
          <Bookmark size={13} aria-hidden />
          {t('resources.savedBookmarks')} ({bookmarkCount})
        </button>
      </Card>

      {/* Resource Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={28} aria-hidden />}
          title={t('resources.noResults')}
          description="Try adjusting your filters or search terms."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-snug text-ink">{r.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{r.provider}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBookmark(r.id)}
                  aria-label={bookmarks.has(r.id) ? t('resources.bookmarked') : t('resources.bookmark')}
                  className={cn(
                    'shrink-0 rounded-lg border p-1.5 transition-colors',
                    bookmarks.has(r.id)
                      ? 'border-teal-300 bg-teal-50 text-teal-600'
                      : 'border-line bg-white text-slate-400 hover:text-teal-600',
                  )}
                >
                  {bookmarks.has(r.id) ? <BookmarkCheck size={15} aria-hidden /> : <Bookmark size={15} aria-hidden />}
                </button>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5">
                <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-medium', typeColorMap[r.type] ?? 'bg-slate-50 text-slate-600 border-slate-200')}>
                  {r.type}
                </span>
                <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-medium', levelColorMap[r.level] ?? '')}>
                  {r.level}
                </span>
                {r.isFree && (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    {t('resources.freeBadge')}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="flex-1 text-xs leading-relaxed text-ink-muted">{r.description}</p>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                <p className="text-[11px] text-ink-subtle">{r.subject}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                  aria-label={`${t('resources.visitLink')}: ${r.title}`}
                >
                  {t('resources.visitLink')}
                  <ExternalLink size={12} aria-hidden />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-ink-subtle">
        All resources link to publicly available websites. EduMitra AI does not host or endorse any external content.
        Bookmarks are saved locally in this browser.
      </p>
    </div>
  )
}
