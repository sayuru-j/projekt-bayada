import { Popup } from 'react-map-gl/maplibre'
import { MapPin, Skull, Smile, X } from 'lucide-react'
import { categoryLabel } from '@/lib/categories'
import { distanceKm, formatDistance } from '@/lib/geo'
import type { HauntedPlace } from '@/types'
import type { UserLocation } from '@/hooks/use-user-location'
import { useLocale } from '@/contexts/locale-context'
import { CategoryAvatar } from '@/components/ui/category-icon'
import { StatChip } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarqueeTitle } from '@/components/ui/marquee-title'

type Props = {
  place: HauntedPlace
  userLocation: UserLocation | null
  onClose: () => void
  onDetails: () => void
}

export function PlacePopup({ place, userLocation, onClose, onDetails }: Props) {
  const { locale, tr } = useLocale()
  const cat = place.category
  const visits = place._count?.visits ?? 0
  const distance = userLocation
    ? formatDistance(
        distanceKm(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude),
      )
    : null

  const [headline, ...rest] = splitFirstSentence(place.description)

  return (
    <Popup
      longitude={place.longitude}
      latitude={place.latitude}
      anchor="left"
      offset={[30, -24]}
      closeButton={false}
      closeOnClick={false}
      maxWidth="none"
    >
      <div className="panel-raised anim-pop-in w-[300px] rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <CategoryAvatar icon={cat?.icon} color={cat?.color ?? '#a3a3a3'} size={40} />
          <div className="min-w-0 flex-1">
            <MarqueeTitle
              as="p"
              text={place.title}
              className="text-[15px] font-semibold text-ink"
            />
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px]">
              <span className="text-muted">{distance ?? place.nearestCity}</span>
              <span className="text-faint">•</span>
              <span className={visits > 0 ? 'text-accent' : 'text-faint'}>
                {visits > 0 ? `${visits} ${tr('survivedCount')}` : tr('noSurvivors')}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr('close')}
            className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <StatChip icon={<Smile size={13} />}>{visits}</StatChip>
          <StatChip icon={<Skull size={13} />}>{place.spookinessRating}/5</StatChip>
          <StatChip icon={<MapPin size={13} />} className="max-w-[140px]">
            <span className="truncate">{place.nearestCity}</span>
          </StatChip>
        </div>

        <p className="mt-4 text-[14px] font-medium leading-snug text-ink">{headline}</p>
        {rest.length > 0 && (
          <ul className="mt-2 space-y-1">
            <li className="flex gap-2 text-[12px] leading-relaxed text-muted">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
              <span className="line-clamp-3">{rest.join(' ')}</span>
            </li>
          </ul>
        )}
        <p className="mt-2 text-[11px] text-faint">{categoryLabel(cat, locale)}</p>

        <Button variant="outline" size="lg" className="mt-4 w-full" onClick={onDetails}>
          {tr('moreDetails')}
        </Button>
      </div>
    </Popup>
  )
}

function splitFirstSentence(text: string): string[] {
  const match = text.match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/)
  if (!match) return [text]
  const first = match[1].trim()
  const rest = match[3].trim()
  return rest ? [first, rest] : [first]
}
