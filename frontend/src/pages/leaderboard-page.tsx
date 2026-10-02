import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import type { LeaderboardEntry } from '@/types'
import { useLocale } from '@/contexts/locale-context'
import { EmptyState, PageShell } from '@/components/layout/page-shell'
import { Avatar } from '@/components/layout/brand'
import { cn } from '@/lib/utils'

export function LeaderboardPage() {
  const { tr } = useLocale()
  const { data = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api<LeaderboardEntry[]>('/leaderboard'),
  })

  return (
    <PageShell width="sm" title={tr('globalSurvivors')} eyebrow={tr('mapName')}>
      {isLoading && (
        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </ul>
      )}

      {!isLoading && data.length === 0 && (
        <EmptyState icon={<Trophy size={20} />} title={tr('noSurvivors')} />
      )}

      <ol className="space-y-2">
        {data.map((entry) => {
          const top = entry.rank <= 3
          return (
            <li
              key={entry.user?.id ?? entry.rank}
              className={cn(
                'panel flex items-center gap-3.5 rounded-2xl px-4 py-3 transition hover:border-border-strong',
                entry.rank === 1 && 'border-accent/70 bg-surface-2',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums',
                  top ? 'bg-ink text-[#111]' : 'bg-surface-3 text-muted',
                )}
              >
                {entry.rank}
              </span>
              <Avatar src={entry.user?.avatarUrl} name={entry.user?.username ?? '?'} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">
                  @{entry.user?.username ?? 'unknown'}
                </p>
                <p className="text-[12px] text-muted">
                  {entry.visitCount} {tr('survivedCount')}
                </p>
              </div>
              <span className="text-[20px] font-semibold tabular-nums text-accent">
                {entry.visitCount}
              </span>
            </li>
          )
        })}
      </ol>
    </PageShell>
  )
}
