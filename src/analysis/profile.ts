import { greatCircleDistance, toLonLat, type Projected } from './geodesy'

/** Intervalo máximo entre muestras, en metros horizontales sobre la esfera (medio píxel del DTM de 20 m). */
export const PROFILE_STEP_M = 10
/** Intervalo alternativo usado solo para mostrar cuánto depende el desnivel acumulado del muestreo. */
export const PROFILE_SENSITIVITY_STEP_M = 40

export type ElevationSampler = (x: number, y: number) => number | null | undefined

export interface ProfileSample {
  /** Longitud horizontal acumulada a lo largo de la polilínea desde el primer vértice: suma de segmentos sobre la esfera (m). */
  distance: number
  x: number
  y: number
  /** Elevación del DTM (interpolación bilineal) o null si no hay información. */
  elevation: number | null
}

export interface ProfileResult {
  samples: ProfileSample[]
  totalDistance: number
  /** Intervalo horizontal medio realmente usado (≤ el pedido). */
  meanSpacing: number
  requestedStep: number
  startElevation: number | null
  endElevation: number | null
  minElevation: number | null
  maxElevation: number | null
  /** Suma de subidas entre muestras consecutivas con dato (m). No se rellenan los huecos. */
  gain: number
  /** Suma de bajadas entre muestras consecutivas con dato (m, valor positivo). */
  loss: number
  /** Longitud horizontal de los intervalos con algún extremo sin dato (criterio conservador: cada intervalo que cruza un límite del DTM cuenta entero). */
  noDataDistance: number
  noDataPercent: number
}

/**
 * Divide cada tramo recto (recto en el CRS, igual que la línea dibujada en el mapa) en partes
 * iguales de como máximo `step` metros horizontales y muestrea la elevación en cada punto.
 * No aplica filtros ni suavizados: cada muestra es el valor bilineal del DTM.
 */
export function sampleRoute(vertices: Projected[], sampler: ElevationSampler, step = PROFILE_STEP_M): ProfileSample[] {
  if (vertices.length < 2) return []
  const value = (x: number, y: number) => { const v = sampler(x, y); return typeof v === 'number' && Number.isFinite(v) ? v : null }
  const samples: ProfileSample[] = [{ distance: 0, x: vertices[0].x, y: vertices[0].y, elevation: value(vertices[0].x, vertices[0].y) }]
  let distance = 0
  for (let i = 1; i < vertices.length; i++) {
    const a = vertices[i - 1], b = vertices[i]
    const segmentLength = greatCircleDistance(toLonLat(a), toLonLat(b))
    if (segmentLength === 0) continue
    const parts = Math.max(1, Math.ceil(segmentLength / step - 1e-9))
    let previous = toLonLat(a)
    for (let k = 1; k <= parts; k++) {
      const t = k / parts
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t
      const current = toLonLat({ x, y })
      distance += greatCircleDistance(previous, current)
      previous = current
      samples.push({ distance, x, y, elevation: value(x, y) })
    }
  }
  return samples
}

export function summarizeProfile(samples: ProfileSample[], requestedStep = PROFILE_STEP_M): ProfileResult {
  const valid = samples.filter((s) => s.elevation !== null).map((s) => s.elevation as number)
  let gain = 0, loss = 0, noDataDistance = 0
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i]
    const interval = b.distance - a.distance
    if (a.elevation === null || b.elevation === null) { noDataDistance += interval; continue }
    const dz = b.elevation - a.elevation
    if (dz > 0) gain += dz
    else loss -= dz
  }
  const totalDistance = samples.length ? samples[samples.length - 1].distance : 0
  return {
    samples,
    totalDistance,
    meanSpacing: samples.length > 1 ? totalDistance / (samples.length - 1) : 0,
    requestedStep,
    startElevation: samples[0]?.elevation ?? null,
    endElevation: samples[samples.length - 1]?.elevation ?? null,
    minElevation: valid.length ? Math.min(...valid) : null,
    maxElevation: valid.length ? Math.max(...valid) : null,
    gain,
    loss,
    noDataDistance,
    noDataPercent: totalDistance > 0 ? (100 * noDataDistance) / totalDistance : 0,
  }
}

export const computeProfile = (vertices: Projected[], sampler: ElevationSampler, step = PROFILE_STEP_M) =>
  summarizeProfile(sampleRoute(vertices, sampler, step), step)

/** Tramos continuos con dato, para dibujar el gráfico con interrupciones visibles. */
export function validRuns(samples: ProfileSample[]): ProfileSample[][] {
  const runs: ProfileSample[][] = []
  let current: ProfileSample[] = []
  for (const s of samples) {
    if (s.elevation === null) { if (current.length) runs.push(current); current = [] }
    else current.push(s)
  }
  if (current.length) runs.push(current)
  return runs
}

/** Intervalos de distancia sin información (algún extremo sin dato), fusionados. */
export function noDataRanges(samples: ProfileSample[]): [number, number][] {
  const ranges: [number, number][] = []
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1].elevation !== null && samples[i].elevation !== null) continue
    const from = samples[i - 1].distance, to = samples[i].distance
    const last = ranges[ranges.length - 1]
    if (last && Math.abs(last[1] - from) < 1e-9) last[1] = to
    else ranges.push([from, to])
  }
  return ranges
}
