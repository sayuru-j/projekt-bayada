/** Free address search via Photon (Komoot) — no API key, Sri Lanka–biased. */

export type GeocodeHit = {
  id: string
  label: string
  lat: number
  lng: number
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    osm_id?: number | string
    osm_type?: string
    name?: string
    street?: string
    housenumber?: string
    city?: string
    district?: string
    county?: string
    state?: string
    country?: string
    postcode?: string
  }
}

const SL_BBOX = '79.4,5.75,82.05,9.95'

function formatLabel(p: NonNullable<PhotonFeature['properties']>): string {
  const parts = [
    [p.housenumber, p.street].filter(Boolean).join(' ').trim() || p.name,
    p.city || p.district || p.county,
    p.state,
  ].filter(Boolean) as string[]
  return [...new Set(parts)].join(', ')
}

export async function searchAddresses(
  query: string,
  locale: 'en' | 'si' = 'en',
  signal?: AbortSignal,
): Promise<GeocodeHit[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lang', locale === 'si' ? 'en' : locale)
  url.searchParams.set('bbox', SL_BBOX)
  url.searchParams.set('lat', '7.8731')
  url.searchParams.set('lon', '80.7718')

  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Address search failed')

  const data = (await res.json()) as { features?: PhotonFeature[] }
  const hits: GeocodeHit[] = []

  for (const f of data.features ?? []) {
    const coords = f.geometry?.coordinates
    const props = f.properties
    if (!coords || !props) continue
    const [lng, lat] = coords
    if (lng < 79.4 || lng > 82.05 || lat < 5.75 || lat > 9.95) continue
    const label = formatLabel(props)
    if (!label) continue
    hits.push({
      id: `${props.osm_type ?? 'n'}-${props.osm_id ?? `${lng},${lat}`}`,
      label,
      lat,
      lng,
    })
  }

  return hits
}
