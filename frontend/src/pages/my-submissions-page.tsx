import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Inbox, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import type { HauntedPlace, SubmissionStatus } from '@/types'
import { useLocale } from '@/contexts/locale-context'
import { EmptyState, PageShell } from '@/components/layout/page-shell'
import { Badge } from '@/components/ui/badge'
import { CategoryAvatar } from '@/components/ui/category-icon'
import { SkullRating } from '@/components/ui/skull-rating'

export function MySubmissionsPage() {
  const { tr } = useLocale()
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-places'],
    queryFn: () => api<HauntedPlace[]>('/places/mine'),
  })

  return (
    <PageShell title={tr('mySubmissions')} subtitle={tr('disclaimer')}>
      {isLoading && (
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </ul>
      )}

      {!isLoading && data.length === 0 && (
        <EmptyState icon={<Inbox size={20} />} title={tr('noPlaces')} />
      )}

      <ul className="space-y-2">
        {data.map((place) => {
          const cat = place.category
          return (
            <li key={place.id} className="panel rounded-2xl p-4 transition hover:border-border-strong">
              <div className="flex items-start gap-3.5">
                <CategoryAvatar
                  icon={cat?.icon}
                  color={cat?.color ?? '#a3a3a3'}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-semibold text-ink">{place.title}</p>
                    <StatusBadge status={place.status} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                    <MapPin size={12} />
                    {place.nearestCity}
                    <span className="text-faint">•</span>
                    {format(new Date(place.createdAt), 'MMM d, yyyy')}
                    <span className="text-faint">•</span>
                    <SkullRating value={place.spookinessRating} size={11} className="gap-0.5" />
                  </p>
                  {place.status === 'rejected' && place.rejectionReason && (
                    <p className="mt-3 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
                      <span className="font-medium">{tr('rejectionReason')}:</span>{' '}
                      {place.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </PageShell>
  )
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { tr } = useLocale()
  const tone = status === 'approved' ? 'accent' : status === 'rejected' ? 'danger' : 'warn'
  return (
    <Badge tone={tone} dot>
      {tr(status)}
    </Badge>
  )
}
