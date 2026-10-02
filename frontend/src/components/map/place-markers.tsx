import { Marker } from 'react-map-gl/maplibre'
import { Ghost, Smile } from 'lucide-react'
import type { HauntedPlace } from '@/types'
import { cn } from '@/lib/utils'
import { playSelect } from '@/lib/sounds'
import { CategoryIcon } from '@/components/ui/category-icon'

type Props = {
  places: HauntedPlace[]
  onSelect: (place: HauntedPlace) => void
  selectedId?: string | null
}

export function PlaceMarkers({ places, onSelect, selectedId }: Props) {
  return (
    <>
      {places.map((place) => {
        const color = place.category?.color ?? '#a3a3a3'
        const active = selectedId === place.id
        const visits = place._count?.visits ?? 0
        return (
          <Marker
            key={place.id}
            longitude={place.longitude}
            latitude={place.latitude}
            anchor="bottom"
            style={{ zIndex: active ? 10 : 1 }}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              playSelect()
              onSelect(place)
            }}
          >
            <button
              type="button"
              aria-label={place.title}
              className="group relative flex cursor-pointer flex-col items-center outline-none"
              data-no-sound
            >
              <span
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200',
                  active ? 'scale-110' : 'group-hover:scale-105',
                )}
                style={{
                  background: color,
                  color: '#111',
                  boxShadow: 'var(--shadow-pin)',
                }}
              >
                <CategoryIcon icon={place.category?.icon} size={17} strokeWidth={2.3} />
              </span>
              <span
                className="-mt-[5px] h-3 w-3 rotate-45"
                style={{
                  background: color,
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  transform: 'rotate(45deg) translate(-1px, 1px)',
                }}
              />
              <span className="pointer-events-none absolute left-1/2 top-full mt-2.5 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-lg border border-border-strong bg-surface-2 px-2 py-1 text-[11px] font-medium tabular-nums text-ink shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
                <Smile size={12} className="text-muted" />
                {visits}
              </span>
            </button>
          </Marker>
        )
      })}
    </>
  )
}

export function UserLocationMarker({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) {
  return (
    <Marker latitude={latitude} longitude={longitude} anchor="center" style={{ zIndex: 5 }}>
      <span className="relative flex h-9 w-9 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-accent/25 [animation:pulse-ring_2.2s_ease-out_infinite]" />
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#041a08] shadow-[0_0_18px_rgba(57,255,20,0.55)]">
          <Ghost size={16} strokeWidth={2.2} />
        </span>
      </span>
    </Marker>
  )
}
