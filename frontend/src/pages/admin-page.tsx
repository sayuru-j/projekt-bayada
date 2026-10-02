import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Check, Inbox, MapPin, Tags, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { mediaUrl, cn } from '@/lib/utils'
import { categoryLabel } from '@/lib/categories'
import type { HauntedPlace, SubmissionStatus } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { EmptyState, PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { CategoryAvatar } from '@/components/ui/category-icon'
import { SkullRating } from '@/components/ui/skull-rating'
import { CategoriesAdminPanel } from '@/components/admin/categories-admin-panel'
import { UsersAdminPanel } from '@/components/admin/users-admin-panel'
import { StatusBadge } from './my-submissions-page'

const QUEUE_TABS: SubmissionStatus[] = ['pending', 'approved', 'rejected']

type AdminSection = 'queue' | 'categories' | 'users'

export function AdminPage() {
  const { user, loading } = useAuth()
  const { locale, tr } = useLocale()
  const [section, setSection] = useState<AdminSection>('queue')
  const [tab, setTab] = useState<SubmissionStatus>('pending')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const qc = useQueryClient()

  const isAdmin = user?.role === 'admin'
  const isMod = !!user && (user.role === 'contributor' || user.role === 'admin')

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-places', tab],
    queryFn: () => api<HauntedPlace[]>(`/admin/places?status=${tab}`),
    enabled: isMod && section === 'queue',
  })

  const approve = useMutation({
    mutationFn: (id: string) => api(`/admin/places/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success('Approved')
      void qc.invalidateQueries({ queryKey: ['admin-places'] })
      void qc.invalidateQueries({ queryKey: ['places'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api(`/admin/places/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      toast.success('Rejected')
      setRejectId(null)
      setReason('')
      void qc.invalidateQueries({ queryKey: ['admin-places'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/places/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(tr('placeDeleted'))
      void qc.invalidateQueries({ queryKey: ['admin-places'] })
      void qc.invalidateQueries({ queryKey: ['places'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (loading) {
    return (
      <PageShell title={tr('admin')}>
        <div className="skeleton h-24 rounded-2xl" />
      </PageShell>
    )
  }
  if (!isMod) return <Navigate to="/" replace />

  return (
    <PageShell
      width="lg"
      title={tr('admin')}
      eyebrow={tr('mapName')}
      actions={
        <div className="flex flex-wrap rounded-full border border-border-strong bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setSection('queue')}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition sm:px-3.5 sm:text-[13px]',
              section === 'queue' ? 'bg-ink text-[#111]' : 'text-muted hover:text-ink',
            )}
          >
            Queue
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setSection('categories')}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition sm:px-3.5 sm:text-[13px]',
                  section === 'categories' ? 'bg-ink text-[#111]' : 'text-muted hover:text-ink',
                )}
              >
                <Tags size={13} />
                {tr('categories')}
              </button>
              <button
                type="button"
                onClick={() => setSection('users')}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition sm:px-3.5 sm:text-[13px]',
                  section === 'users' ? 'bg-ink text-[#111]' : 'text-muted hover:text-ink',
                )}
              >
                <Users size={13} />
                {tr('users')}
              </button>
            </>
          )}
        </div>
      }
      toolbar={
        section === 'queue' ? (
          <div className="flex w-fit rounded-full border border-border-strong bg-surface-2 p-1">
            {QUEUE_TABS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTab(s)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
                  tab === s ? 'bg-ink text-[#111]' : 'text-muted hover:text-ink',
                )}
              >
                {tr(s)}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      {section === 'categories' && isAdmin ? (
        <CategoriesAdminPanel />
      ) : section === 'users' && isAdmin ? (
        <UsersAdminPanel />
      ) : (
        <>
          {isLoading && (
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </ul>
          )}

          {!isLoading && data.length === 0 && (
            <EmptyState icon={<Inbox size={20} />} title={tr('emptyQueue')} />
          )}

          <ul className="space-y-3">
            {data.map((place) => {
              const cat = place.category
              return (
                <li key={place.id} className="panel rounded-2xl p-4 sm:p-5">
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
                        <span>{categoryLabel(cat, locale)}</span>
                        <span className="text-faint">•</span>
                        <MapPin size={12} />
                        {place.nearestCity}
                        <span className="text-faint">•</span>
                        <span className="tabular-nums">
                          {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                        </span>
                        <span className="text-faint">•</span>
                        <SkullRating value={place.spookinessRating} size={11} className="gap-0.5" />
                      </p>
                      {place.createdBy && (
                        <p className="mt-1 text-[12px] text-faint">
                          @{place.createdBy.username} ·{' '}
                          {format(new Date(place.createdAt), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-3.5 text-[14px] leading-relaxed text-ink-soft">
                    {place.description}
                  </p>

                  {place.media.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {place.media.map((m) =>
                        m.mediaType === 'image' ? (
                          <a
                            key={m.id}
                            href={mediaUrl(m.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-xl border border-border-strong"
                          >
                            <img src={mediaUrl(m.url)} alt="" className="h-24 w-32 object-cover" />
                          </a>
                        ) : m.youtubeId ? (
                          <div
                            key={m.id}
                            className="overflow-hidden rounded-xl border border-border-strong bg-black"
                          >
                            <iframe
                              title="preview"
                              className="h-24 w-44"
                              src={`https://www.youtube-nocookie.com/embed/${m.youtubeId}`}
                            />
                          </div>
                        ) : null,
                      )}
                    </div>
                  )}

                  {tab === 'pending' && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => approve.mutate(place.id)}
                        disabled={approve.isPending}
                      >
                        <Check size={14} />
                        {tr('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRejectId(rejectId === place.id ? null : place.id)}
                      >
                        <X size={14} />
                        {tr('reject')}
                      </Button>
                    </div>
                  )}

                  {isAdmin && tab === 'approved' && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        size="icon-sm"
                        variant="danger"
                        aria-label={tr('deletePlace')}
                        title={tr('deletePlace')}
                        disabled={remove.isPending}
                        onClick={() => {
                          if (!window.confirm(tr('confirmDeletePlace'))) return
                          remove.mutate(place.id)
                        }}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}

                  {rejectId === place.id && (
                    <div className="anim-pop-in mt-3 space-y-2.5 rounded-2xl border border-border-strong bg-surface-3 p-3.5">
                      <Label>{tr('rejectionReason')}</Label>
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Inappropriate / Not haunted / Incomplete evidence"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={reason.trim().length < 3 || reject.isPending}
                          onClick={() => reject.mutate({ id: place.id, reason: reason.trim() })}
                        >
                          {tr('reject')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejectId(null)}>
                          {tr('close')}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </PageShell>
  )
}
