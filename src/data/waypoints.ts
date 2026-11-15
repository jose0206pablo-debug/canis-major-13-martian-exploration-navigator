import { dataUrl } from './manifest'

/** Posición histórica de Perseverance según MMGIS (NASA/JPL). No es una ruta humana. */
export interface Waypoint {
  rmc: string
  site: number
  drive: number
  sol: number
  lon: number
  lat: number
  elevGeoid: number
  distTotalM: number
  final: string
  note: string
}

type RawFeature = { geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> }

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

/** Valida y convierte el GeoJSON reducido. Usa la geometría lon/lat (nunca easting/northing, D-04). */
export function parseWaypoints(collection: { features?: RawFeature[] }): Waypoint[] {
  return (collection.features ?? []).flatMap((feature) => {
    const coords = feature.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates) ? feature.geometry.coordinates : null
    const p = feature.properties ?? {}
    const lon = num(coords?.[0]), lat = num(coords?.[1]), sol = num(p.sol), elev = num(p.elev_geoid)
    if (lon === null || lat === null || sol === null || elev === null || typeof p.RMC !== 'string') return []
    return [{ rmc: p.RMC, site: num(p.site) ?? NaN, drive: num(p.drive) ?? NaN, sol, lon, lat, elevGeoid: elev, distTotalM: num(p.dist_total_m) ?? NaN, final: String(p.final ?? ''), note: String(p.Note ?? '') }]
  })
}

export async function loadWaypoints(path: string): Promise<Waypoint[]> {
  const response = await fetch(dataUrl(path))
  if (!response.ok) throw new Error(`No se pudo cargar ${path} (${response.status})`)
  return parseWaypoints(await response.json())
}

const LOCALIZATION: Record<string, string> = {
  'End-of-drive localization': 'Localización al final del recorrido del día',
  'Mid-drive localization': 'Localización a mitad de recorrido',
  Interpolated: 'Posición interpolada (no medida)',
  'First localization!': 'Primera localización',
  'Site increment, no motion.': 'Cambio de sitio sin movimiento',
}
export const localizationLabel = (note: string) => LOCALIZATION[note] ?? note
export const isInterpolated = (w: Waypoint) => w.note === 'Interpolated'
