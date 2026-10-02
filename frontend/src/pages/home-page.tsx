import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { distanceKm } from '@/lib/geo'
import type { HauntedPlace } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { useUserLocation } from '@/hooks/use-user-location'
import { Sidebar } from '@/components/sidebar/sidebar'
import { MobileSheet, MobileTopBar } from '@/components/sidebar/mobile-chrome'
import type { SortKey } from '@/components/sidebar/place-list'
import { HolmanMap } from '@/components/map/holman-map'
import { PlaceDrawer } from '@/components/places/place-drawer'
import { ReportPlaceModal } from '@/components/places/report-place-modal'

export function HomePage() {
  const { user, loginWithGoogle } = useAuth()
  const { tr } = useLocale()
  const { location, status, request } = useUserLocation()

  const [reportOpen, setReportOpen] = useState(false)
  const [selected, setSelected] = useState<HauntedPlace | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [minRating, setMinRating] = useState(1)
  const [locateRequest, setLocateRequest] = useState(0)

  const { data: places = [], isLoading, refetch } = useQuery({
    queryKey: ['places'],
    queryFn: () => api<HauntedPlace[]>('/places'),
  })

  useEffect(() => {
    if (status !== 'idle') return
    void request()
  }, [status, request])

  useEffect(() => {
    if (sort === 'nearest' && !location && status === 'denied') {
      toast.message(tr('locationNeeded'))
    }
  }, [sort, location, status, tr])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = places.filter((p) => {
      if (categoryId !== 'all' && p.categoryId !== categoryId && p.category?.id !== categoryId) {
        return false
      }
      if (p.spookinessRating < minRating) return false
      if (q && !`${p.title} ${p.nearestCity} ${p.description}`.toLowerCase().includes(q)) {
        return false
      }
      return true
    })

    const sorted = [...list]
    if (sort === 'spookiest') {
      sorted.sort((a, b) => b.spookinessRating - a.spookinessRating)
    } else if (sort === 'nearest' && location) {
      sorted.sort(
        (a, b) =>
          distanceKm(location.latitude, location.longitude, a.latitude, a.longitude) -
          distanceKm(location.latitude, location.longitude, b.latitude, b.longitude),
      )
    } else {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    }
    return sorted
  }, [places, search, categoryId, minRating, sort, location])

  const openReport = () => {
    if (!user) {
      loginWithGoogle()
      return
    }
    setReportOpen(true)
  }

  const goToMyLocation = async () => {
    setSelected(null)
    setDetailsId(null)
    const loc = location ?? (await request())
    if (!loc) {
      toast.message(tr('locationNeeded'))
      return
    }
    setLocateRequest((n) => n + 1)
  }

  const handleSelect = (place: HauntedPlace | null) => {
    setSelected(place)
    if (place && !window.matchMedia('(min-width: 1024px)').matches) {
      setDetailsId(place.id)
    }
  }

  const listProps = {
    places: filtered,
    total: places.length,
    selectedId: selected?.id ?? null,
    onSelect: handleSelect,
    isLoading,
    search,
    onSearch: setSearch,
    categoryId,
    onCategory: setCategoryId,
    sort,
    onSort: setSort,
    minRating,
    onMinRating: setMinRating,
    userLocation: location,
    locating: status === 'loading',
    onLocate: () => void goToMyLocation(),
  }

  return (
    <div className="h-full min-h-0 w-full bg-canvas lg:p-4">
      <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-surface max-lg:rounded-none lg:rounded-[28px] lg:border lg:border-border">
        <Sidebar
          {...listProps}
          onReport={openReport}
          onGoToMyLocation={() => void goToMyLocation()}
          className="hidden lg:flex"
        />

        <div className="relative min-h-0 min-w-0 flex-1">
          <MobileTopBar
            onReport={openReport}
            onGoToMyLocation={() => void goToMyLocation()}
          />

          <HolmanMap
            places={filtered}
            selected={selected}
            onSelect={handleSelect}
            onDetails={(p) => setDetailsId(p.id)}
            userLocation={location}
            isLoading={isLoading}
            showPopup={!detailsId}
            locateRequest={locateRequest}
          />

          <MobileSheet {...listProps} hidden={!!detailsId} />

          {detailsId && (
            <PlaceDrawer
              key={detailsId}
              placeId={detailsId}
              onClose={() => setDetailsId(null)}
              onVisited={() => void refetch()}
            />
          )}
        </div>
      </div>

      <ReportPlaceModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}
