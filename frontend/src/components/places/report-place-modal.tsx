import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Maximize2, MapPin, PlayCircle, Search, X } from 'lucide-react'
import { api, API_URL, getToken } from '@/lib/api'
import { extractYouTubeId } from '@/lib/utils'
import { categoryLabel } from '@/lib/categories'
import { MAP_CENTER, MAP_STYLE, SRI_LANKA_BOUNDS } from '@/lib/map'
import { searchAddresses, type GeocodeHit } from '@/lib/geocode'
import { useCategories } from '@/hooks/use-categories'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { FieldHint, Input, Label, Select, Textarea } from '@/components/ui/input'
import { SkullRating } from '@/components/ui/skull-rating'

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(4000),
  categoryId: z.string().uuid('Pick a category'),
  spookinessRating: z.coerce.number().int().min(1).max(5),
  nearestCity: z.string().min(2).max(80),
  youtubeUrl: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onClose: () => void
}

const fieldSm = 'rounded-lg px-3 py-2 text-[13px]'
const labelSm = 'mb-1 text-[11px]'

export function ReportPlaceModal({ open, onClose }: Props) {
  const { locale, tr } = useLocale()
  const qc = useQueryClient()
  const { data: categories = [], isLoading: catsLoading } = useCategories()
  const [files, setFiles] = useState<FileList | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [mapExpanded, setMapExpanded] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      spookinessRating: 3,
      nearestCity: '',
      youtubeUrl: '',
      latitude: MAP_CENTER[1],
      longitude: MAP_CENTER[0],
    },
  })

  useEffect(() => {
    if (!open) setMapExpanded(false)
  }, [open])

  const dropPin = (lng: number, lat: number) => {
    setCoords({ lat, lng })
    form.setValue('latitude', lat)
    form.setValue('longitude', lng)
  }
  useEffect(() => {
    if (!open || !categories.length) return
    const current = form.getValues('categoryId')
    if (!current || !categories.some((c) => c.id === current)) {
      form.setValue('categoryId', categories[0].id)
    }
  }, [open, categories, form])

  const rating = form.watch('spookinessRating')
  const errors = form.formState.errors

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const evidence: Array<{
        mediaType: 'image' | 'youtube'
        url: string
        youtubeId?: string
      }> = []

      if (values.youtubeUrl?.trim()) {
        const id = extractYouTubeId(values.youtubeUrl.trim())
        if (!id) throw new Error('Invalid YouTube URL')
        evidence.push({ mediaType: 'youtube', url: values.youtubeUrl.trim(), youtubeId: id })
      }

      if (files?.length) {
        const body = new FormData()
        Array.from(files)
          .slice(0, 3)
          .forEach((f) => body.append('files', f))
        const uploadRes = await fetch(`${API_URL}/uploads/evidence`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken() ?? ''}` },
          body,
        })
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          throw new Error(err.message || 'Image upload failed')
        }
        const uploaded = (await uploadRes.json()) as {
          files: Array<{ url: string; mediaType: 'image' }>
        }
        uploaded.files.forEach((f) => evidence.push({ mediaType: 'image', url: f.url }))
      }

      if (!evidence.length) throw new Error('Add at least one image or YouTube link')

      return api('/places', {
        method: 'POST',
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          categoryId: values.categoryId,
          spookinessRating: values.spookinessRating,
          nearestCity: values.nearestCity,
          latitude: values.latitude,
          longitude: values.longitude,
          evidence,
        }),
      })
    },
    onSuccess: () => {
      toast.success('Submitted for review')
      void qc.invalidateQueries({ queryKey: ['my-places'] })
      form.reset()
      setFiles(null)
      setCoords(null)
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (!open) return null

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel-raised anim-slide-up flex max-h-[min(92dvh,92vh)] w-full max-w-lg flex-col overflow-hidden rounded-t-[22px] pb-[env(safe-area-inset-bottom)] sm:rounded-[18px] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{tr('report')}</h2>
            <p className="text-[11px] text-muted">{tr('mapName')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr('close')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-white/[0.06] hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <form
          className="space-y-3 overflow-y-auto px-4 py-3.5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
            <div>
              <Label className={labelSm}>{tr('title')}</Label>
              <Input
                className={fieldSm}
                {...form.register('title')}
                placeholder="St. Andrews Bungalow"
              />
              {errors.title && <FieldHint>{errors.title.message}</FieldHint>}
            </div>
            <div>
              <Label className={labelSm}>{tr('nearest')}</Label>
              <Input
                className={fieldSm}
                {...form.register('nearestCity')}
                placeholder="Nuwara Eliya"
              />
              {errors.nearestCity && <FieldHint>{errors.nearestCity.message}</FieldHint>}
            </div>
          </div>

          <div>
            <Label className={labelSm}>{tr('description')}</Label>
            <Textarea
              rows={3}
              className={`${fieldSm} min-h-[72px] leading-snug`}
              {...form.register('description')}
            />
            {errors.description && <FieldHint>{errors.description.message}</FieldHint>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelSm}>{tr('category')}</Label>
              <Select
                className={fieldSm}
                {...form.register('categoryId')}
                disabled={catsLoading || !categories.length}
              >
                {!categories.length && <option value="">{tr('loading')}</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {categoryLabel(cat, locale)}
                  </option>
                ))}
              </Select>
              {errors.categoryId && <FieldHint>{errors.categoryId.message}</FieldHint>}
            </div>
            <div>
              <Label className={labelSm}>{tr('spookiness')}</Label>
              <div className="flex h-9 items-center rounded-lg border border-border bg-field px-2.5">
                <SkullRating
                  value={rating}
                  size={15}
                  onChange={(v) => form.setValue('spookinessRating', v, { shouldValidate: true })}
                />
                <span className="ml-auto text-[11px] tabular-nums text-muted">{rating}/5</span>
              </div>
            </div>
          </div>

          <div>
            <Label className={`flex items-center justify-between ${labelSm}`}>
              <span>{tr('pickMap')}</span>
              {coords && (
                <span className="flex items-center gap-1 text-[11px] font-normal text-accent">
                  <MapPin size={10} />
                  <span className="tabular-nums">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </span>
                </span>
              )}
            </Label>
            <div className="relative h-36 overflow-hidden rounded-xl border border-border-strong sm:h-40">
              {!mapExpanded && (
                <PinPickerMap
                  coords={coords}
                  onDrop={dropPin}
                  initialZoom={7}
                />
              )}
              <button
                type="button"
                onClick={() => setMapExpanded(true)}
                aria-label={tr('expandMap')}
                className="absolute right-2 top-2 z-10 flex h-8 items-center gap-1.5 rounded-lg border border-border-strong bg-canvas/90 px-2 text-[11px] font-medium text-ink shadow-sm backdrop-blur-sm transition hover:bg-surface-2"
              >
                <Maximize2 size={12} />
                {tr('expandMap')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className={`flex items-center gap-1 ${labelSm}`}>
                <PlayCircle size={11} />
                {tr('youtube')}
              </Label>
              <Input
                className={fieldSm}
                placeholder="https://youtube.com/…"
                {...form.register('youtubeUrl')}
              />
            </div>
            <div>
              <Label className={`flex items-center gap-1 ${labelSm}`}>
                <ImagePlus size={11} />
                {tr('images')}
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                className={`${fieldSm} py-1.5`}
                onChange={(e) => setFiles(e.target.files)}
              />
            </div>
          </div>

          <p className="text-[10px] leading-snug text-faint">{tr('disclaimer')}</p>

          <Button
            type="submit"
            variant="accent"
            size="md"
            className="w-full"
            disabled={mutation.isPending || !coords || !categories.length}
          >
            {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
            {tr('submit')}
          </Button>
        </form>
      </div>

      {mapExpanded && (
        <ExpandedPinPicker
          coords={coords}
          onDrop={dropPin}
          onDone={() => setMapExpanded(false)}
        />
      )}
    </div>
  )
}

function ExpandedPinPicker({
  coords,
  onDrop,
  onDone,
}: {
  coords: { lat: number; lng: number } | null
  onDrop: (lng: number, lat: number) => void
  onDone: () => void
}) {
  const { locale, tr } = useLocale()
  const mapRef = useRef<MapRef>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<GeocodeHit[]>([])
  const [searching, setSearching] = useState(false)
  const [openResults, setOpenResults] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      return
    }

    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchAddresses(q, locale, ctrl.signal)
        if (!ctrl.signal.aborted) {
          setHits(results)
          setOpenResults(true)
        }
      } catch {
        if (!ctrl.signal.aborted) setHits([])
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 350)

    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [query, locale])

  const goToHit = (hit: GeocodeHit) => {
    onDrop(hit.lng, hit.lat)
    setQuery(hit.label)
    setHits([])
    setOpenResults(false)
    mapRef.current?.flyTo({
      center: [hit.lng, hit.lat],
      zoom: 15.5,
      duration: 900,
      essential: true,
    })
  }

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[60] flex flex-col bg-canvas"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">{tr('pickMap')}</p>
          {coords && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-accent">
              <MapPin size={10} />
              <span className="tabular-nums">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </p>
          )}
        </div>
        <Button type="button" variant="accent" size="md" className="shrink-0" onClick={onDone}>
          {tr('donePicking')}
        </Button>
      </div>

      <div className="relative z-20 border-b border-border px-3 py-2.5">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hits.length > 0 && setOpenResults(true)}
            placeholder={tr('searchAddress')}
            className="rounded-xl py-2.5 pl-9 pr-9 text-[13px]"
            autoComplete="off"
          />
          {(query || searching) && (
            <button
              type="button"
              aria-label={tr('close')}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink"
              onClick={() => {
                setQuery('')
                setHits([])
                setOpenResults(false)
              }}
            >
              {searching ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            </button>
          )}
        </div>

        {openResults && query.trim().length >= 2 && (
          <ul className="absolute inset-x-3 top-[calc(100%-2px)] z-30 max-h-56 overflow-y-auto rounded-b-xl border border-t-0 border-border-strong bg-surface-2 shadow-[var(--shadow-raised)]">
            {searching && hits.length === 0 && (
              <li className="px-3 py-2.5 text-[12px] text-muted">{tr('searchingAddress')}</li>
            )}
            {!searching && hits.length === 0 && (
              <li className="px-3 py-2.5 text-[12px] text-muted">{tr('noAddressResults')}</li>
            )}
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-[13px] text-ink transition hover:bg-accent/10"
                  onClick={() => goToHit(hit)}
                >
                  <MapPin size={13} className="mt-0.5 shrink-0 text-accent" />
                  <span className="leading-snug">{hit.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
        <PinPickerMap
          mapRef={mapRef}
          coords={coords}
          onDrop={onDrop}
          initialZoom={coords ? 12 : 8}
          fitPadding={40}
        />
      </div>
    </div>
  )
}

function PinMarker({ lat, lng }: { lat: number; lng: number }) {
  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <span className="flex flex-col items-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#041a08] shadow-[var(--shadow-pin)]">
          <MapPin size={15} strokeWidth={2.4} />
        </span>
        <span
          className="-mt-[3px] h-2 w-2 bg-accent"
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
            transform: 'rotate(45deg)',
          }}
        />
      </span>
    </Marker>
  )
}

function PinPickerMap({
  coords,
  onDrop,
  initialZoom,
  fitPadding = 16,
  mapRef,
}: {
  coords: { lat: number; lng: number } | null
  onDrop: (lng: number, lat: number) => void
  initialZoom: number
  fitPadding?: number
  mapRef?: React.RefObject<MapRef | null>
}) {
  return (
    <div className="map-osm-raster h-full w-full bg-black">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: coords?.lng ?? MAP_CENTER[0],
          latitude: coords?.lat ?? MAP_CENTER[1],
          zoom: initialZoom,
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        maxBounds={SRI_LANKA_BOUNDS}
        minZoom={6.5}
        attributionControl={false}
        onLoad={(e) => {
          if (coords) {
            e.target.jumpTo({ center: [coords.lng, coords.lat], zoom: initialZoom })
            return
          }
          e.target.fitBounds(
            [
              [SRI_LANKA_BOUNDS[0], SRI_LANKA_BOUNDS[1]],
              [SRI_LANKA_BOUNDS[2], SRI_LANKA_BOUNDS[3]],
            ],
            { padding: fitPadding, duration: 0, maxZoom: 8 },
          )
        }}
        onClick={(e) => {
          const { lng, lat } = e.lngLat
          onDrop(lng, lat)
        }}
      >
        {coords && <PinMarker lat={coords.lat} lng={coords.lng} />}
      </Map>
    </div>
  )
}
