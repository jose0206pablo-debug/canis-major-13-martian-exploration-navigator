import type { LonLat } from './geodesy'
import { PROFILE_SENSITIVITY_STEP_M, PROFILE_STEP_M, type ProfileResult } from './profile'

/**
 * V1.3 · Comparación de escenarios hipotéticos (A = referencia ilustrativa, B = alternativa del usuario).
 * NO introduce fórmulas nuevas: solo resta resultados que ya produce `computeProfile` para cada escenario.
 * NO elige, recomienda ni certifica recorridos.
 */

/** Alternativa B: empieza exactamente en el origen de A (los puntos intermedios los añade el usuario). */
export function startAlternative(origin: LonLat): LonLat[] {
  return [{ lon: origin.lon, lat: origin.lat }]
}

/** Cierra la alternativa B añadiendo exactamente el destino de A. Garantiza el origen común aunque la lista llegue alterada. */
export function finishAlternative(route: LonLat[], origin: LonLat, destination: LonLat): LonLat[] {
  const intermediates = route.length && sameVertex(route[0], origin) ? route.slice(1) : route
  return [{ lon: origin.lon, lat: origin.lat }, ...intermediates, { lon: destination.lon, lat: destination.lat }]
}

export const sameVertex = (a: LonLat, b: LonLat) => a.lon === b.lon && a.lat === b.lat

/** Comprueba que dos escenarios comparten exactamente origen y destino. */
export function sharesEndpoints(a: LonLat[], b: LonLat[]): boolean {
  return a.length >= 2 && b.length >= 2 && sameVertex(a[0], b[0]) && sameVertex(a[a.length - 1], b[b.length - 1])
}

export type Verdict = 'more' | 'less' | 'same'

export interface MetricComparison {
  a: number
  b: number
  /** b − a */
  delta: number
  /** Cambio observado en la métrica al muestrear a 10 m y a 40 m (sensibilidad al intervalo; NO es la incertidumbre total del DTM). */
  tolerance: number
  verdict: Verdict
}

export interface ScenarioComparison {
  distance: MetricComparison
  gain: MetricComparison
  loss: MetricComparison
  noData: { a: number; b: number; aDistance: number; bDistance: number }
  /** true si A o B tiene tramos sin dato del DTM: el ascenso y el descenso no son comparables de forma completa. */
  noDataAffects: boolean
  sentence: string
}

/** Diferencias de distancia por debajo de 1 m se consideran la misma distancia (redondeo de la geometría). */
export const DISTANCE_TOLERANCE_M = 1

function metric(a: number, b: number, tolerance: number): MetricComparison {
  const delta = b - a
  return { a, b, delta, tolerance, verdict: Math.abs(delta) <= tolerance ? 'same' : delta > 0 ? 'more' : 'less' }
}

const km = (m: number) => (Math.abs(m) < 1000 ? `${Math.abs(m).toFixed(0)} m` : `${(Math.abs(m) / 1000).toFixed(2)} km`)

/**
 * Compara A y B. La sensibilidad del ascenso/descenso es la diferencia entre el muestreo principal (≤ 10 m) y el
 * de 40 m, la misma que ya muestra el panel; se toma la mayor de los dos escenarios.
 */
export function compareScenarios(a: ProfileResult, aSens: ProfileResult, b: ProfileResult, bSens: ProfileResult): ScenarioComparison {
  const gainTol = Math.max(Math.abs(a.gain - aSens.gain), Math.abs(b.gain - bSens.gain))
  const lossTol = Math.max(Math.abs(a.loss - aSens.loss), Math.abs(b.loss - bSens.loss))
  const distance = metric(a.totalDistance, b.totalDistance, DISTANCE_TOLERANCE_M)
  const gain = metric(a.gain, b.gain, gainTol)
  const loss = metric(a.loss, b.loss, lossTol)
  const noData = { a: a.noDataPercent, b: b.noDataPercent, aDistance: a.noDataDistance, bDistance: b.noDataDistance }
  const noDataAffects = a.noDataDistance > 0 || b.noDataDistance > 0
  return { distance, gain, loss, noData, noDataAffects, sentence: describe(distance, gain, loss, noDataAffects) }
}

/** V1.3.1: texto para diferencias menores o iguales a la sensibilidad al intervalo de muestreo (no a la incertidumbre total del DTM). */
export const SAMPLING_CHANGE = `al cambio observado al muestrear a ${PROFILE_STEP_M} m y ${PROFILE_SENSITIVITY_STEP_M} m`

/** Conclusión solo descriptiva: cantidades y sentido de la diferencia, sin valoración. */
export function describe(distance: MetricComparison, gain: MetricComparison, loss: MetricComparison, noDataAffects: boolean): string {
  const d = distance.verdict === 'same' ? 'B recorre la misma distancia horizontal que A' : `B recorre ${km(distance.delta)} ${distance.verdict === 'more' ? 'más' : 'menos'} que A`
  if (noDataAffects) return `${d}. El ascenso y el descenso no se comparan porque A o B tiene tramos sin datos del DTM.`
  if (gain.verdict === 'same' && loss.verdict === 'same') return `${d}; sus diferencias de ascenso y de descenso son menores o iguales ${SAMPLING_CHANGE}.`
  const relief = (m: MetricComparison, name: string) => m.verdict === 'same'
    ? `una diferencia de ${name} menor o igual ${SAMPLING_CHANGE}`
    : `${Math.abs(m.delta).toFixed(1)} m ${m.verdict === 'more' ? 'más' : 'menos'} de ${name}`
  return `${d}, acumula ${relief(gain, 'ascenso')} y ${relief(loss, 'descenso')}.`
}

/** Escala común para dibujar los perfiles de A y B: mismo rango vertical y misma longitud horizontal. */
export interface SharedScale { y0: number; y1: number; distance: number }

export function sharedProfileScale(a: ProfileResult, b: ProfileResult): SharedScale | null {
  const mins = [a.minElevation, b.minElevation].filter((v): v is number => v !== null)
  const maxs = [a.maxElevation, b.maxElevation].filter((v): v is number => v !== null)
  if (!mins.length || !maxs.length) return null
  const min = Math.min(...mins), max = Math.max(...maxs)
  const pad = Math.max(2, (max - min) * 0.08) // mismo margen que ProfileChart usa para un perfil
  return { y0: min - pad, y1: max + pad, distance: Math.max(a.totalDistance, b.totalDistance) }
}
