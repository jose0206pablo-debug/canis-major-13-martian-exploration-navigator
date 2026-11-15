import { MARS_SPHERE_RADIUS } from '../data/mars-crs'
import type { LonLat } from './geodesy'

/**
 * Disco NOMINAL de Jezero: centro y diámetro del Gazetteer of Planetary Nomenclature (USGS/IAU, Feature 14300,
 * https://planetarynames.wr.usgs.gov/Feature/14300; planetocéntrica, +E). Es una idealización circular
 * para dar contexto: NO es el borde real del cráter.
 */
export const JEZERO_NOMINAL = {
  name: 'Jezero',
  center: { lon: 77.69, lat: 18.41 } as LonLat,
  diameterKm: 47.52,
  source: 'Gazetteer of Planetary Nomenclature (USGS/IAU), Feature 14300',
} as const

/** Extensión de los datos CTX de alta resolución (Sector A), según la etiqueta PDS3 de D-001. */
export const SECTOR_A_EXTENT = { west: 77.16046545922367, east: 77.6989751662947, south: 18.211027390963398, north: 18.721194481872804 } as const

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Punto a una distancia (m) y un rumbo (°, desde el norte) sobre la esfera marciana. */
export function destinationPoint(from: LonLat, bearingDeg: number, distanceM: number, radius = MARS_SPHERE_RADIUS): LonLat {
  const d = distanceM / radius, b = rad(bearingDeg), p1 = rad(from.lat), l1 = rad(from.lon)
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b))
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2))
  return { lon: deg(l2), lat: deg(p2) }
}

/** Polígono del disco nominal: n vértices a la distancia (diámetro/2) del centro sobre la esfera. */
export function nominalDiskPolygon(n = 180): LonLat[] {
  const r = (JEZERO_NOMINAL.diameterKm * 1000) / 2
  return Array.from({ length: n }, (_, i) => destinationPoint(JEZERO_NOMINAL.center, (360 * i) / n, r))
}
