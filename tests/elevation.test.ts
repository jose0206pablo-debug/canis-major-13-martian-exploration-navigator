import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { pixelValue, sampleBilinear, type ElevationGrid } from '../src/data/elevation'

const NODATA = -3.4028226550889045e38
// Rejilla 3 × 2 de 20 m con origen en (0, 40): centros de píxel en x = 10, 30, 50 e y = 30, 10.
const grid: ElevationGrid = { width: 3, height: 2, originX: 0, originY: 40, pixelSize: 20, nodata: NODATA, values: new Float32Array([0, 10, 20, 100, 110, NODATA]) }

describe('muestreo de elevación', () => {
  it('devuelve el valor del píxel que contiene el punto', () => {
    expect(pixelValue(grid, 5, 35)).toBe(0)
    expect(pixelValue(grid, 25, 15)).toBe(110)
  })

  it('interpola bilinealmente entre centros de píxel', () => {
    expect(sampleBilinear(grid, 10, 30)).toBeCloseTo(0, 6)
    expect(sampleBilinear(grid, 20, 30)).toBeCloseTo(5, 6)
    expect(sampleBilinear(grid, 20, 20)).toBeCloseTo(55, 6)
  })

  it('devuelve null fuera de la extensión o cuando un vecino es NoData', () => {
    expect(pixelValue(grid, -1, 35)).toBeNull()
    expect(sampleBilinear(grid, 70, 30)).toBeNull()
    expect(pixelValue(grid, 55, 15)).toBeNull()
    expect(sampleBilinear(grid, 45, 15)).toBeNull()
  })
})

const manifestPath = fileURLToPath(new URL('../public/data/manifest.json', import.meta.url))
const hasData = existsSync(manifestPath)

describe.skipIf(!hasData)('binario real del DTM D-001 (requiere generar_derivados)', () => {
  it('reproduce los valores de gdallocationinfo en los píxeles de control', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    const info = manifest.elevation
    const bytes = readFileSync(fileURLToPath(new URL(`../public/data/${info.url}`, import.meta.url)))
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
    const [originX, pixelSize, , originY] = info.geotransform
    const real: ElevationGrid = { width: info.width, height: info.height, originX, originY, pixelSize, nodata: info.nodata, values }
    // Aterrizaje (waypoint 3_0) en metros proyectados, como en las pruebas G1/G2.
    expect(pixelValue(real, 4590877.824, 1093299.695)).toBeCloseTo(-2567.19165039062, 4)
    const center = (col: number, row: number) => [originX + (col + 0.5) * pixelSize, originY - (row + 0.5) * pixelSize] as const
    expect(pixelValue(real, ...center(864, 749))).toBeCloseTo(-2561.537109375, 4)
    expect(sampleBilinear(real, ...center(860, 819))).toBeCloseTo(-2567.19165039062, 4)
  })
})
