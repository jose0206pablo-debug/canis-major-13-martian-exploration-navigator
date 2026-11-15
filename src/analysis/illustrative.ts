import type { LonLat } from './geodesy'
import { isInterpolated, type Waypoint } from '../data/waypoints'

/**
 * «Recorrido ilustrativo CANIS»: línea recta entre dos posiciones documentadas de Perseverance (MMGIS, NASA/JPL),
 * elegidas con una regla reproducible y sin juicio geológico:
 *  - inicio: la posición RMC 3_0 (sol 13), primera localización tras el aterrizaje;
 *  - destino: la posición NO interpolada con mayor `elev_geoid` publicada en el archivo.
 * No es una ruta propuesta, segura, óptima ni transitable: solo ilustra el perfil del terreno entre esos dos puntos.
 */
export interface IllustrativeRoute {
  start: Waypoint
  end: Waypoint
  vertices: LonLat[]
}

export const ILLUSTRATIVE_START_RMC = '3_0'

export function selectIllustrativeRoute(waypoints: Waypoint[]): IllustrativeRoute | null {
  const start = waypoints.find((w) => w.rmc === ILLUSTRATIVE_START_RMC)
  const candidates = waypoints.filter((w) => !isInterpolated(w) && Number.isFinite(w.elevGeoid))
  if (!start || !candidates.length) return null
  // Mayor elevación publicada; en caso de empate, el primero en el orden del archivo (reproducible).
  const end = candidates.reduce((best, w) => (w.elevGeoid > best.elevGeoid ? w : best))
  if (end === start) return null
  return { start, end, vertices: [{ lon: start.lon, lat: start.lat }, { lon: end.lon, lat: end.lat }] }
}
