import type { MapPoint } from '../data/types'
import { formatElevation } from '../utils/format'

export function CoordinateBar({ cursor, elevationError }: { cursor: MapPoint | null; elevationError?: string | null }) {
  if (!cursor) return <div className="coordinate-bar">Mueve el cursor sobre el mapa para consultar coordenadas y elevación.</div>
  const { lat, lon } = cursor.coordinates
  return <div className="coordinate-bar">
    <span>{lat.toFixed(5)}° N, {lon.toFixed(5)}° E</span>
    <span>x {cursor.projected.x.toFixed(0)} m · y {cursor.projected.y.toFixed(0)} m</span>
    <span>Elev. {formatElevation(cursor.elevation, elevationError)}</span>
  </div>
}
