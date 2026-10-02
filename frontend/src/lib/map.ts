import type { StyleSpecification } from 'maplibre-gl'

/** Geographic center of Sri Lanka */
export const MAP_CENTER: [number, number] = [80.7718, 7.8731]

/** Whole island of Sri Lanka [west, south, east, north] */
export const SRI_LANKA_BOUNDS: [number, number, number, number] = [
  79.4, 5.75, 82.05, 9.95,
]

/** Initial view radius when the map loads (~5 km). */
export const MAP_INITIAL_RADIUS_KM = 5

/**
 * Zoom that frames roughly a 5 km radius at Sri Lankan latitudes
 * on a typical desktop map viewport.
 */
export const MAP_INITIAL_ZOOM = 13.2

/** Lng/lat bounds for a circular radius (axis-aligned box). */
export function radiusBounds(
  longitude: number,
  latitude: number,
  radiusKm = MAP_INITIAL_RADIUS_KM,
): [[number, number], [number, number]] {
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180))
  return [
    [longitude - lngDelta, latitude - latDelta],
    [longitude + lngDelta, latitude + latDelta],
  ]
}

/**
 * Free OpenStreetMap vector style (OpenFreeMap) — no API key.
 * https://openfreemap.org
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'

/**
 * Free OSM raster fallback (no key). Used only if OpenFreeMap fails.
 * Avoids CARTO basemaps, which now watermark "API KEY REQUIRED".
 */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  name: 'OpenStreetMap',
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

/** @deprecated alias — prefer OSM_RASTER_STYLE */
export const OSM_DARK_RASTER_STYLE = OSM_RASTER_STYLE

/** Primary free map style — raster OSM is reliable across remounts/WebGL. */
export const MAP_STYLE: string | StyleSpecification = OSM_RASTER_STYLE
