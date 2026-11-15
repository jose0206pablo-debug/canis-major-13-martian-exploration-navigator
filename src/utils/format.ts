import type { MapPoint } from '../data/types'

export function formatElevation(elevation: MapPoint['elevation'], error?: string | null) {
  if (error) return 'elevación no disponible'
  if (elevation === undefined) return 'cargando DTM…'
  if (elevation === null) return 'sin dato (fuera del DTM)'
  return `${elevation.toFixed(1)} m`
}

/** Distancia horizontal: metros por debajo de 1 km; kilómetros con dos decimales por encima. */
export function formatDistance(meters: number) {
  return meters < 1000 ? `${meters.toFixed(0)} m` : `${(meters / 1000).toFixed(2)} km`
}
