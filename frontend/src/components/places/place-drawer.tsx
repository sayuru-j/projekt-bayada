import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CheckCircle2, Crosshair, Loader2, MapPin, Skull, Smile, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/categories'
import { distanceKm, formatDistance } from '@/lib/geo'
import { mediaUrl } from '@/lib/utils'
import type { HauntedPlace, VisitResult } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { StatChip } from '@/components/ui/badge'
import { SkullRating } from '@/components/ui/skull-rating'
import { CategoryAvatar } from '@/components/ui/category-icon'
import { Avatar } from '@/components/layout/brand'
import { MarqueeTitle } from '@/components/ui/marquee-title'
import { PlaceComments } from '@/components/places/place-comments'

/** Must match backend VisitsService radius. */
const VISIT_RADIUS_METERS = 500

type Props = {
  placeId: string
  onClose: () => void
  onVisited?: () => void
}

export function PlaceDrawer({ placeId, onClose, onVisited }: Props) {
  const { user, loginWithGoogle } = useAuth()
  const { locale, tr } = useLocale()
  const qc = useQueryClient()
  const [locating, setLocating] = useState(false)

  const { data: place, isLoading } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => api<HauntedPlace>(`/places/${placeId}`),
  })

  const visitMutation = useMutation({
    mutationFn: (coords: { latitude: number; longitude: number }) =>
      api<VisitResult>(`/places/${placeId}/visit`, {
        method: 'POST',
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        void qc.invalidateQueries({ queryKey: ['place', placeId] })
        void qc.invalidateQueries({ queryKey: ['places'] })
        void qc.invalidateQueries({ queryKey: ['leaderboard'] })
        onVisited?.()
        return
      }

      if (typeof result.distance === 'number') {
        toast.error(
          `${tr('tooFar')}: ${formatDistance(result.distance / 1000)} (need ≤ ${result.requiredWithinMeters ?? VISIT_RADIUS_METERS} m)`,
        )
      } else {
        toast.error(result.message)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const claimVisit = () => {
    if (!user) {
      toast.message(tr('needAuth'))
      loginWithGoogle()
      return
    }
    if (!place) return
    if (!navigator.geolocation) {
      toast.error(tr('geoUnsupported'))
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude
        const longitude = pos.coords.longitude
        setLocating(false)

        // Client-side preview vs place pin (server re-checks authoritatively).
        const approxM =
          distanceKm(place.latitude, place.longitude, latitude, longitude) * 1000
        if (approxM > VISIT_RADIUS_METERS) {
          toast.message(
            `${tr('tooFar')}: ~${formatDistance(approxM / 1000)} · verifying…`,
          )
        }

        visitMutation.mutate({ latitude, longitude })
      },
      () => {
        setLocating(false)
        toast.error(tr('geoDenied'))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const cat = place?.category
  const visitCount = place?._count?.visits ?? place?.visits?.length ?? 0
  const claiming = locating || visitMutation.isPending

  return (
    <aside className="panel-raised anim-slide-up absolute inset-x-0 bottom-0 z-40 flex max-h-[min(86dvh,86vh)] flex-col overflow-hidden rounded-t-[26px] border-b-0 pb-[env(safe-area-inset-bottom)] lg:anim-slide-in-right lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-4 lg:max-h-none lg:w-[min(400px,calc(100vw-2rem))] lg:rounded-[22px] lg:border-b lg:pb-0">
      <div className="flex items-start gap-3 px-5 pb-4 pt-4">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/20 lg:hidden" />
      </div>
      <div className="-mt-4 flex items-start gap-3 px-5 pb-4">
        {place ? (
          <CategoryAvatar icon={cat?.icon} color={cat?.color ?? '#a3a3a3'} size={44} />
        ) : (
          <span className="skeleton h-11 w-11 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          {place ? (
            <MarqueeTitle
              text={place.title}
              className="text-[17px] font-semibold text-ink"
            />
          ) : (
            <h2 className="truncate text-[17px] font-semibold text-ink">{tr('loading')}</h2>
          )}
          {place && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
              <MapPin size={12} />
              <span className="truncate">{place.nearestCity}</span>
              <span className="text-faint">•</span>
              <span>{categoryLabel(cat, locale)}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={tr('close')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      {isLoading || !place ? (
        <div className="space-y-3 px-5 pb-6">
          <div className="skeleton h-9 w-full rounded-xl" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-44 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6">
          <div className="flex flex-wrap gap-1.5">
            <StatChip icon={<Smile size={13} />}>{visitCount}</StatChip>
            <StatChip icon={<Skull size={13} />}>
              <SkullRating value={place.spookinessRating} size={12} className="gap-0.5" />
            </StatChip>
            <StatChip icon={<MapPin size={13} />}>
              <span className="tabular-nums">
                {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
              </span>
            </StatChip>
          </div>

          <p className="text-[14px] leading-relaxed text-ink-soft">{place.description}</p>

          {place.media.length > 0 && (
            <section>
              <h3 className="label-sm mb-2.5">{tr('evidence')}</h3>
              <div className="space-y-2.5">
                {place.media.map((m) =>
                  m.mediaType === 'youtube' && m.youtubeId ? (
                    <div
                      key={m.id}
                      className="overflow-hidden rounded-2xl border border-border-strong bg-black"
                    >
                      <iframe
                        title="YouTube evidence"
                        className="aspect-video w-full"
                        src={`https://www.youtube-nocookie.com/embed/${m.youtubeId}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      className="overflow-hidden rounded-2xl border border-border-strong"
                    >
                      <img
                        src={mediaUrl(m.url)}
                        alt=""
                        loading="lazy"
                        className="max-h-60 w-full object-cover"
                      />
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border-strong bg-surface-3 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-soft">{tr('visitors')}</span>
              <span className="text-[22px] font-semibold tabular-nums text-accent">{visitCount}</span>
            </div>

            {place.myVisit ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 text-sm font-medium text-accent">
                <CheckCircle2 size={16} />
                {tr('survived')}
              </div>
            ) : (
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={claimVisit}
                disabled={claiming}
              >
                {claiming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Crosshair size={16} />
                )}
                {locating
                  ? tr('locating')
                  : visitMutation.isPending
                    ? tr('verifyingGps')
                    : tr('claimVisit')}
              </Button>
            )}

            {place.visits && place.visits.length > 0 && (
              <ul className="mt-4 max-h-44 divide-y divide-border overflow-y-auto text-sm">
                {place.visits.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar src={v.user.avatarUrl} name={v.user.username} size={24} />
                      <span className="truncate text-[13px] text-ink">@{v.user.username}</span>
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-muted">
                      {format(new Date(v.visitedAt), 'MMM d, yyyy')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <PlaceComments placeId={place.id} comments={place.comments ?? []} />

          <p className="text-[11px] leading-relaxed text-faint">{tr('disclaimer')}</p>
        </div>
      )}
    </aside>
  )
}
