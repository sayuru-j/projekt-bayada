import { useEffect, useRef, useState } from 'react'
import Map, { NavigationControl, type MapRef } from 'react-map-gl/maplibre'
import { Loader2 } from 'lucide-react'
import {
  MAP_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_STYLE,
  OSM_RASTER_STYLE,
  SRI_LANKA_BOUNDS,
  radiusBounds,
} from '@/lib/map'
import type { HauntedPlace } from '@/types'
import type { UserLocation } from '@/hooks/use-user-location'
import { useLocale } from '@/contexts/locale-context'
import { PlaceMarkers, UserLocationMarker } from './place-markers'
import { PlacePopup } from './place-popup'
import { RouteGlow } from './route-glow'

type Props = {
  places: HauntedPlace[]
  selected: HauntedPlace | null
  onSelect: (place: HauntedPlace | null) => void
  onDetails: (place: HauntedPlace) => void
  userLocation: UserLocation | null
  isLoading: boolean
  showPopup: boolean
  locateRequest?: number
}

function fitRadius(
  map: { fitBounds: MapRef['fitBounds'] },
  longitude: number,
  latitude: number,
  duration = 0,
) {
  map.fitBounds(radiusBounds(longitude, latitude), {
    padding: { top: 48, bottom: 48, left: 32, right: 32 },
    duration,
    maxZoom: 14,
  })
}

function getMapLibre(mapRef: React.RefObject<MapRef | null>) {
  return mapRef.current?.getMap?.() ?? null
}

export function HolmanMap({
  places,
  selected,
  onSelect,
  onDetails,
  userLocation,
  isLoading,
  showPopup,
  locateRequest = 0,
}: Props) {
  const { tr } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef>(null)
  const initialFitDone = useRef(false)
  const centeredOnUser = useRef(false)
  const [mapKey, setMapKey] = useState(0)
  const mapStyle = MAP_STYLE

  const resizeMap = () => {
    const map = getMapLibre(mapRef)
    if (!map) return
    try {
      map.resize()
      map.triggerRepaint()
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const schedule = () => {
      requestAnimationFrame(() => {
        resizeMap()
        requestAnimationFrame(resizeMap)
      })
    }

    const onResume = (ev: Event) => {
      const remount = (ev as CustomEvent<{ remount?: boolean }>).detail?.remount
      if (remount) {
        initialFitDone.current = false
        setMapKey((k) => k + 1)
      }
      schedule()
      window.setTimeout(schedule, 80)
      window.setTimeout(schedule, 250)
    }

    const ro = new ResizeObserver(schedule)
    ro.observe(el)

    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('bayada:map-resume', onResume)
    const onVis = () => {
      if (document.visibilityState === 'visible') schedule()
    }
    document.addEventListener('visibilitychange', onVis)

    schedule()
    const timers = [50, 200, 500].map((ms) => window.setTimeout(schedule, ms))

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      window.removeEventListener('bayada:map-resume', onResume)
      document.removeEventListener('visibilitychange', onVis)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  useEffect(() => {
    if (!selected || !mapRef.current) return
    const map = mapRef.current
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    resizeMap()
    map.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(map.getZoom(), MAP_INITIAL_ZOOM),
      offset: isDesktop ? [150, 0] : [0, -100],
      duration: 900,
      essential: true,
    })
  }, [selected, mapKey])

  useEffect(() => {
    if (!userLocation || !mapRef.current || centeredOnUser.current) return
    if (selected) return
    centeredOnUser.current = true
    fitRadius(mapRef.current, userLocation.longitude, userLocation.latitude, 800)
  }, [userLocation, selected, mapKey])

  useEffect(() => {
    if (!locateRequest || !userLocation || !mapRef.current) return
    centeredOnUser.current = true
    resizeMap()
    fitRadius(mapRef.current, userLocation.longitude, userLocation.latitude, 900)
  }, [locateRequest, userLocation])

  useEffect(() => {
    const id = window.setTimeout(resizeMap, 320)
    return () => window.clearTimeout(id)
  }, [showPopup, selected, isLoading, mapKey])

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-0 w-full bg-black${
        mapStyle === OSM_RASTER_STYLE ? ' map-osm-raster' : ''
      }`}
    >
      <Map
        key={mapKey}
        ref={mapRef}
        initialViewState={{
          longitude: userLocation?.longitude ?? MAP_CENTER[0],
          latitude: userLocation?.latitude ?? MAP_CENTER[1],
          zoom: MAP_INITIAL_ZOOM,
        }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%', minHeight: 200 }}
        maxBounds={SRI_LANKA_BOUNDS}
        minZoom={6.5}
        maxZoom={18}
        attributionControl={false}
        onClick={() => onSelect(null)}
        onLoad={(e) => {
          const map = e.target
          map.resize()
          const lng = userLocation?.longitude ?? MAP_CENTER[0]
          const lat = userLocation?.latitude ?? MAP_CENTER[1]
          if (userLocation) centeredOnUser.current = true
          initialFitDone.current = true
          fitRadius(map, lng, lat, 0)
          requestAnimationFrame(() => {
            map.resize()
            fitRadius(map, lng, lat, 0)
          })
          window.setTimeout(() => map.resize(), 100)
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {userLocation && selected && (
          <RouteGlow
            from={[userLocation.longitude, userLocation.latitude]}
            to={[selected.longitude, selected.latitude]}
          />
        )}

        <PlaceMarkers places={places} selectedId={selected?.id} onSelect={onSelect} />

        {userLocation && (
          <UserLocationMarker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          />
        )}

        {selected && showPopup && (
          <PlacePopup
            place={selected}
            userLocation={userLocation}
            onClose={() => onSelect(null)}
            onDetails={() => onDetails(selected)}
          />
        )}
      </Map>

      {isLoading && (
        <div className="anim-fade-in pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="panel-raised flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] text-ink-soft">
            <Loader2 size={15} className="animate-spin text-accent" />
            {tr('loading')}
          </div>
        </div>
      )}
    </div>
  )
}
