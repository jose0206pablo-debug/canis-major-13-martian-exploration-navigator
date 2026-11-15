import { describe, expect, it } from 'vitest'
import { computeProfile, noDataRanges, sampleRoute, validRuns, type ElevationSampler } from '../src/analysis/profile'
import { METERS_PER_DEGREE } from '../src/analysis/geodesy'

// En el ecuador (y = 0) los metros proyectados en x coinciden con los horizontales sobre la esfera.
const ramp: ElevationSampler = (x) => 0.1 * x // pendiente constante: +1 m cada 10 m hacia el este
const along = (fromX: number, toX: number) => [{ x: fromX, y: 0 }, { x: toX, y: 0 }]

describe('muestreo de un recorrido', () => {
  it('divide en intervalos iguales de como máximo 10 m e incluye los extremos', () => {
    const samples = sampleRoute(along(0, 1005), ramp)
    expect(samples.length).toBe(102) // ceil(1005 / 10) = 101 intervalos
    expect(samples[0].x).toBe(0)
    expect(samples[samples.length - 1].x).toBeCloseTo(1005, 9)
    const spacing = samples[1].distance - samples[0].distance
    expect(spacing).toBeLessThanOrEqual(10)
    expect(spacing).toBeCloseTo(1005 / 101, 6)
  })

  it('suma la distancia horizontal de varios tramos', () => {
    const p = computeProfile([{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 400 }], () => 0)
    expect(p.totalDistance).toBeCloseTo(700, 3)
    expect(p.gain).toBe(0)
    expect(p.loss).toBe(0)
  })

  it('aplica la escala real de la latitud: 1 km proyectado en E-O a 18,5° N mide 1000·cos(18,5°) m', () => {
    const y = 18.5 * METERS_PER_DEGREE
    const p = computeProfile([{ x: 77 * METERS_PER_DEGREE, y }, { x: 77 * METERS_PER_DEGREE + 1000, y }], () => 0)
    expect(p.totalDistance).toBeCloseTo(1000 * Math.cos((18.5 * Math.PI) / 180), 2)
  })
})

describe('métricas del perfil', () => {
  it('calcula elevaciones y desnivel en una rampa conocida', () => {
    const p = computeProfile(along(0, 1000), ramp)
    expect(p.startElevation).toBeCloseTo(0, 9)
    expect(p.endElevation).toBeCloseTo(100, 9)
    expect(p.minElevation).toBeCloseTo(0, 9)
    expect(p.maxElevation).toBeCloseTo(100, 9)
    expect(p.gain).toBeCloseTo(100, 6)
    expect(p.loss).toBeCloseTo(0, 9)
    expect(p.noDataPercent).toBe(0)
  })

  it('separa subida y bajada en un recorrido de ida y vuelta', () => {
    const p = computeProfile([{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 0, y: 0 }], ramp)
    expect(p.gain).toBeCloseTo(50, 6)
    expect(p.loss).toBeCloseTo(50, 6)
    expect(p.totalDistance).toBeCloseTo(1000, 3)
  })

  it('no rellena los huecos: excluye del desnivel los intervalos sin dato y los cuenta como sin información', () => {
    const halfMissing: ElevationSampler = (x) => (x > 500 ? null : 0.1 * x)
    const p = computeProfile(along(0, 1000), halfMissing)
    expect(p.endElevation).toBeNull()
    expect(p.maxElevation).toBeCloseTo(50, 6)
    expect(p.gain).toBeCloseTo(50, 6)
    expect(p.noDataPercent).toBeCloseTo(50, 6)
    expect(noDataRanges(p.samples)).toEqual([[expect.closeTo(500, 6), expect.closeTo(1000, 6)]])
    expect(validRuns(p.samples)).toHaveLength(1)
  })

  it('detecta huecos interiores y devuelve tramos separados para el gráfico', () => {
    const gap: ElevationSampler = (x) => (x > 300 && x < 600 ? null : 1)
    const p = computeProfile(along(0, 1000), gap)
    expect(validRuns(p.samples)).toHaveLength(2)
    const ranges = noDataRanges(p.samples)
    expect(ranges).toHaveLength(1)
    expect(ranges[0][0]).toBeCloseTo(300, 6)
    expect(ranges[0][1]).toBeCloseTo(600, 6)
    expect(p.noDataPercent).toBeCloseTo(30, 6)
  })

  it('trata undefined (DTM sin cargar) como falta de información y nunca devuelve NaN', () => {
    const p = computeProfile(along(0, 100), () => undefined)
    expect(p.minElevation).toBeNull()
    expect(p.gain).toBe(0)
    expect(p.noDataPercent).toBe(100)
  })

  it('el desnivel acumulado depende del intervalo de muestreo cuando el relieve oscila (ruido)', () => {
    // Oscilación de ±1 m cada 20 m: a 10 m se ve entera; a 40 m se muestrea siempre en el mismo valor.
    const noisy: ElevationSampler = (x) => Math.sin((2 * Math.PI * x) / 20 - Math.PI / 2)
    const fine = computeProfile(along(0, 400), noisy, 5)
    const coarse = computeProfile(along(0, 400), noisy, 40)
    expect(fine.gain).toBeGreaterThan(30)
    expect(coarse.gain).toBeCloseTo(0, 6)
  })

  it('con menos de dos vértices no hay perfil', () => {
    expect(sampleRoute([{ x: 0, y: 0 }], ramp)).toEqual([])
    expect(computeProfile([], ramp).totalDistance).toBe(0)
  })
})
