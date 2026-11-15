import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { toProjected } from '../src/analysis/geodesy'
import { computeProfile } from '../src/analysis/profile'
import { sampleBilinear, type ElevationGrid } from '../src/data/elevation'

// Valores de referencia calculados de forma independiente con GDAL 3.13.3 (InterpolateAtPoint bilineal sobre el
// GeoTIFF original D-001) por 05_PROTOTIPO/pruebas/contraste_perfil_gdal.py → fase3_perfil_contraste_gdal.json.
const R1 = { vertices: [[77.4508, 18.4447], [77.4, 18.48], [77.37, 18.51]], samples: 602, distance: 5991.332463646524, start: -2567.150592542501, end: -2428.898940208095, min: -2570.1211677693636, max: -2414.726090700592, gain: 205.20837197391984, loss: 66.95671963951418 }
const R2 = { vertices: [[77.22, 18.4], [77.1, 18.4]], samples: 676, distance: 6749.320629281851, start: -2070.7506247317233, min: -2123.0611611814697, max: -2064.3999222664497, gain: 49.3494427272326, loss: 97.01006740755747, gdalNoDataPercent: 50.518518518508984 }
// Borde oeste del DTM (etiqueta PDS3): la fracción geométrica fuera de la extensión es (77.16046545922367 − 77.1) / 0.12.
const R2_GEOMETRIC_OUTSIDE_PERCENT = (100 * (77.16046545922367 - 77.1)) / 0.12

const manifestPath = fileURLToPath(new URL('../public/data/manifest.json', import.meta.url))

describe.skipIf(!existsSync(manifestPath))('perfil sobre el DTM real frente a GDAL (requiere generar_derivados)', () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  const info = manifest.elevation
  const bytes = readFileSync(fileURLToPath(new URL(`../public/data/${info.url}`, import.meta.url)))
  const [originX, pixelSize, , originY] = info.geotransform
  const grid: ElevationGrid = { width: info.width, height: info.height, originX, originY, pixelSize, nodata: info.nodata, values: new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4) }
  const sampler = (x: number, y: number) => sampleBilinear(grid, x, y)
  const profileOf = (vertices: number[][]) => computeProfile(vertices.map(([lon, lat]) => toProjected({ lon, lat })), sampler)

  it('recorrido interior: distancia, elevaciones y desnivel iguales a GDAL', () => {
    const p = profileOf(R1.vertices)
    expect(p.samples).toHaveLength(R1.samples)
    expect(p.totalDistance).toBeCloseTo(R1.distance, 6)
    expect(p.startElevation).toBeCloseTo(R1.start, 3)
    expect(p.endElevation).toBeCloseTo(R1.end, 3)
    expect(p.minElevation).toBeCloseTo(R1.min, 3)
    expect(p.maxElevation).toBeCloseTo(R1.max, 3)
    expect(p.gain).toBeCloseTo(R1.gain, 2)
    expect(p.loss).toBeCloseTo(R1.loss, 2)
    expect(p.noDataPercent).toBe(0)
  })

  it('recorrido que sale por el oeste: tramo sin dato detectado y valores interiores iguales a GDAL', () => {
    const p = profileOf(R2.vertices)
    expect(p.samples).toHaveLength(R2.samples)
    expect(p.totalDistance).toBeCloseTo(R2.distance, 6)
    expect(p.startElevation).toBeCloseTo(R2.start, 3)
    expect(p.endElevation).toBeNull()
    expect(p.minElevation).toBeCloseTo(R2.min, 3)
    expect(p.maxElevation).toBeCloseTo(R2.max, 3)
    expect(p.gain).toBeCloseTo(R2.gain, 2)
    expect(p.loss).toBeCloseTo(R2.loss, 2)
    expect(p.noDataPercent).toBeCloseTo(R2.gdalNoDataPercent, 6)
    // Frente a la geometría pura, el porcentaje sin dato puede exceder como mucho en un intervalo (≤ 10 m):
    // el intervalo que cruza el borde cuenta entero como «sin información».
    const oneInterval = (100 * 10) / R2.distance
    expect(p.noDataPercent - R2_GEOMETRIC_OUTSIDE_PERCENT).toBeGreaterThanOrEqual(0)
    expect(p.noDataPercent - R2_GEOMETRIC_OUTSIDE_PERCENT).toBeLessThanOrEqual(oneInterval)
  })
})
