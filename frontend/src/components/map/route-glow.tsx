import { Layer, Source } from 'react-map-gl/maplibre'
import type { Feature, LineString } from 'geojson'

type Props = {
  from: [number, number]
  to: [number, number]
}

export function RouteGlow({ from, to }: Props) {
  const feature: Feature<LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [from, to],
    },
  }

  return (
    <Source id="route-glow" type="geojson" data={feature}>
      <Layer
        id="route-glow-outer"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': '#39ff14',
          'line-width': 14,
          'line-blur': 10,
          'line-opacity': 0.35,
        }}
      />
      <Layer
        id="route-glow-core"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': '#39ff14',
          'line-width': 3,
          'line-opacity': 0.95,
        }}
      />
    </Source>
  )
}
