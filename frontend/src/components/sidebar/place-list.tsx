import { useState } from 'react'
import { LocateFixed, Search, Skull, SlidersHorizontal, Smile } from 'lucide-react'
import { categoryLabel } from '@/lib/categories'
import { distanceKm, formatDistance } from '@/lib/geo'
import { cn } from '@/lib/utils'
import type { HauntedPlace, PlaceCategory } from '@/types'
import type { UserLocation } from '@/hooks/use-user-location'
import { useCategories } from '@/hooks/use-categories'
import { useLocale } from '@/contexts/locale-context'
import { CategoryAvatar } from '@/components/ui/category-icon'
import { SkullRating } from '@/components/ui/skull-rating'

export type SortKey = 'nearest' | 'spookiest' | 'newest'

export type PlaceListControls = {
  search: string
  onSearch: (v: string) => void
  categoryId: string | 'all'
  onCategory: (v: string | 'all') => void
  sort: SortKey
  onSort: (v: SortKey) => void
  minRating: number
  onMinRating: (v: number) => void
  userLocation: UserLocation | null
  locating: boolean
  onLocate: () => void
}

type Props = PlaceListControls & {
  places: HauntedPlace[]
  total: number
  selectedId: string | null
  onSelect: (place: HauntedPlace) => void
  isLoading: boolean
  className?: string
  compact?: boolean
}

export function PlaceList({
  places,
  total,
  selectedId,
  onSelect,
  isLoading,
  className,
  compact,
  search,
  onSearch,
  categoryId,
  onCategory,
  sort,
  onSort,
  minRating,
  onMinRating,
  userLocation,
  locating,
  onLocate,
}: Props) {
  const { locale, tr } = useLocale()
  const { data: categories = [] } = useCategories()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersActive = minRating > 1

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className={cn('shrink-0 space-y-3', compact ? 'px-3 pb-2' : 'px-5 pb-4')}>
        <label className="relative block">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={tr('search')}
            className={cn(
              'w-full rounded-xl border border-border bg-field pl-4 pr-11 text-sm text-ink placeholder:text-faint transition hover:border-border-strong focus:ring-focus',
              compact ? 'h-10' : 'h-11',
            )}
          />
          <Search
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          />
        </label>

        <div className="no-scrollbar flex items-end gap-2 overflow-x-auto pb-0.5">
          <div className="flex shrink-0 flex-col gap-1">
            <span className="label-sm">{tr('showMe')}</span>
            <select
              value={categoryId}
              onChange={(e) => onCategory(e.target.value as string | 'all')}
              className="h-9 max-w-[42vw] cursor-pointer rounded-full border border-border-strong bg-surface-2 pl-3 pr-2 text-[12px] font-medium text-ink-soft transition hover:border-[#4a4a4a] hover:text-ink focus:ring-focus sm:max-w-none sm:pl-3.5 sm:text-[13px]"
            >
              <option value="all">{tr('allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {categoryLabel(cat, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex shrink-0 flex-col gap-1">
            <span className="label-sm">{tr('sortBy')}</span>
            <select
              value={sort}
              onChange={(e) => onSort(e.target.value as SortKey)}
              className="h-9 cursor-pointer rounded-full border border-border-strong bg-surface-2 pl-3 pr-2 text-[12px] font-medium text-ink-soft transition hover:border-[#4a4a4a] hover:text-ink focus:ring-focus sm:pl-3.5 sm:text-[13px]"
            >
              <option value="nearest">{tr('sortNearest')}</option>
              <option value="spookiest">{tr('sortSpookiest')}</option>
              <option value="newest">{tr('sortNewest')}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-[12px] font-medium transition sm:px-3.5 sm:text-[13px]',
              filtersOpen || filtersActive
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-border-strong bg-surface-2 text-ink-soft hover:border-[#4a4a4a] hover:text-ink',
            )}
          >
            <SlidersHorizontal size={14} />
            {tr('filters')}
            {filtersActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
          </button>
        </div>

        {filtersOpen && (
          <div className="anim-pop-in panel-raised space-y-3 rounded-2xl p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="label-sm">{tr('minSpookiness')}</span>
              <SkullRating
                value={minRating}
                size={15}
                onChange={(v) => onMinRating(v === minRating ? 1 : v)}
              />
            </div>
            <button
              type="button"
              onClick={onLocate}
              disabled={locating}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition',
                userLocation
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-border-strong bg-surface-3 text-ink-soft hover:text-ink',
              )}
            >
              <LocateFixed size={14} className={cn(locating && 'animate-pulse')} />
              {userLocation ? tr('youAreHere') : tr('locate')}
            </button>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <ul className={cn('h-full space-y-1 overflow-y-auto pb-16', compact ? 'px-3' : 'px-3')}>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                <span className="skeleton h-11 w-11 rounded-full" />
                <span className="flex-1 space-y-2">
                  <span className="skeleton block h-3.5 w-2/3 rounded" />
                  <span className="skeleton block h-3 w-1/2 rounded" />
                </span>
              </li>
            ))}

          {!isLoading && places.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-muted">
              {total === 0 ? tr('noPlaces') : tr('noResults')}
            </li>
          )}

          {places.map((place) => (
            <PlaceRow
              key={place.id}
              place={place}
              active={place.id === selectedId}
              onClick={() => onSelect(place)}
              userLocation={userLocation}
            />
          ))}
        </ul>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" />
      </div>
    </div>
  )
}

function PlaceRow({
  place,
  active,
  onClick,
  userLocation,
}: {
  place: HauntedPlace
  active: boolean
  onClick: () => void
  userLocation: UserLocation | null
}) {
  const { tr } = useLocale()
  const cat = place.category as PlaceCategory | undefined
  const visits = place._count?.visits ?? 0
  const distance = userLocation
    ? formatDistance(
        distanceKm(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude),
      )
    : null

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-[background-color,border-color,box-shadow] duration-150',
          active
            ? 'border-accent/70 bg-surface-2'
            : 'border-transparent hover:bg-white/[0.04]',
        )}
      >
        <CategoryAvatar
          icon={cat?.icon}
          color={cat?.color ?? '#a3a3a3'}
          size={44}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-ink">{place.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px]">
            <span className="truncate text-muted">{distance ?? place.nearestCity}</span>
            <span className="text-faint">•</span>
            <span className={cn('truncate', visits > 0 ? 'text-accent' : 'text-faint')}>
              {visits > 0 ? `${visits} ${tr('survivedCount')}` : tr('noSurvivors')}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5 text-muted">
          <span className="flex items-center gap-1 text-[11px] tabular-nums">
            <Skull size={13} />
            {place.spookinessRating}
          </span>
          <span className="flex items-center gap-1 text-[11px] tabular-nums">
            <Smile size={13} />
            {visits}
          </span>
        </span>
      </button>
    </li>
  )
}
