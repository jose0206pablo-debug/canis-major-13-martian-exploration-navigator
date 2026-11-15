import { MARS_SPHERE_RADIUS } from '../data/mars-crs'

/** Metros proyectados por grado en el CRS IAU_2015:49910 (equirectangular, paralelo estándar 0°, esfera de 3 396 190 m). */
export const METERS_PER_DEGREE = (MARS_SPHERE_RADIUS * Math.PI) / 180

export interface LonLat { lon: number; lat: number }
export interface Projected { x: number; y: number }

/** En esta proyección x = R·λ e y = R·φ (λ, φ en radianes): la conversión es exacta y lineal. */
export const toLonLat = ({ x, y }: Projected): LonLat => ({ lon: x / METERS_PER_DEGREE, lat: y / METERS_PER_DEGREE })
export const toProjected = ({ lon, lat }: LonLat): Projected => ({ x: lon * METERS_PER_DEGREE, y: lat * METERS_PER_DEGREE })

const rad = (deg: number) => (deg * Math.PI) / 180

/**
 * Distancia de círculo máximo (fórmula del haversine) sobre la esfera marciana.
 * Es una distancia horizontal: no incluye el desnivel.
 */
export function greatCircleDistance(a: LonLat, b: LonLat, radius = MARS_SPHERE_RADIUS): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)))
}
