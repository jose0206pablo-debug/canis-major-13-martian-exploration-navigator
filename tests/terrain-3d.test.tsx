import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Terrain3D } from '../src/components/Terrain3D'
import type { ProfileResult } from '../src/analysis/profile'
import { gridFromInfo, type ElevationGrid } from '../src/data/elevation'
import type { DataManifest } from '../src/data/manifest'
import { MARS_SPHERE_RADIUS } from '../src/data/mars-crs'
import { DEFAULT_EXAGGERATION, MESH_STRIDE_DESKTOP, MESH_STRIDE_NARROW } from '../src/terrain/config'
import { buildTerrainMesh, paletteRgb, profileRunsTo3D, sampledIndices, toTerrainPoint } from '../src/terrain/mesh'

const synthetic = (width = 5, height = 5): ElevationGrid => ({
  width, height, originX: 4573663.250853, originY: 1109693.140188,
  pixelSize: 20, nodata: -3.4028226550889045e38,
  values: Float32Array.from({ length: width * height }, (_, index) => -2000 + index),
})

describe('terrain 3D from the canonical DTM', () => {
  it('uses exact source pixel heights and east-west ground spacing at Jezero latitude', () => {
    const grid = synthetic()
    const mesh = buildTerrainMesh(grid, 2)
    expect(sampledIndices(5, 2)).toEqual([0, 2, 4])
    expect(mesh.vertices).toBe(9)
    expect(mesh.triangles).toBe(8)
    expect(mesh.elevations[0]).toBe(grid.values[0])
    expect(mesh.elevations[8]).toBe(grid.values[24])
    expect(mesh.positions[1]).toBeCloseTo((grid.values[0] - mesh.baseElevation) / 1000)
    const lat = mesh.centerY / MARS_SPHERE_RADIUS
    expect(mesh.eastWestFactor).toBeCloseTo(Math.cos(lat), 10)
    expect(mesh.positions[3] - mesh.positions[0]).toBeCloseTo(40 * Math.cos(lat) / 1000, 5)
    expect(mesh.positions[11] - mesh.positions[2]).toBeCloseTo(40 / 1000, 5)
    expect(Array.from(mesh.indices.slice(0, 6))).toEqual([0, 3, 1, 1, 3, 4])
  })

  it('leaves a gap for NoData even if the missing cell is between sampled vertices', () => {
    const grid = synthetic()
    grid.values[12] = Math.fround(grid.nodata!)
    const mesh = buildTerrainMesh(grid, 4)
    expect(mesh.sourceNoData).toBe(1)
    expect(mesh.noDataNodes).toBe(0)
    expect(mesh.skippedQuads).toBe(1)
    expect(mesh.triangles).toBe(0)
  })

  it('places A/B from existing profile samples and preserves a NoData break', () => {
    const mesh = buildTerrainMesh(synthetic(), 2)
    const profile = { samples: [
      { distance: 0, x: mesh.centerX, y: mesh.centerY, elevation: -2000 },
      { distance: 10, x: mesh.centerX + 20, y: mesh.centerY, elevation: -1990 },
      { distance: 20, x: mesh.centerX + 40, y: mesh.centerY, elevation: null },
      { distance: 30, x: mesh.centerX + 60, y: mesh.centerY, elevation: -1980 },
      { distance: 40, x: mesh.centerX + 80, y: mesh.centerY, elevation: -1970 },
    ] } as ProfileResult
    const runs = profileRunsTo3D(profile, mesh)
    expect(runs).toHaveLength(2)
    expect(Array.from(runs[0].slice(0, 3))).toEqual(Array.from(Float32Array.from(
      toTerrainPoint(mesh, mesh.centerX, mesh.centerY, -2000),
    )))
    expect(runs[0][3]).toBeCloseTo(20 * mesh.eastWestFactor / 1000, 5)
    expect(runs[1]).toHaveLength(6)
  })

  it('uses the manifest palette and 1× initial vertical scale', () => {
    expect(paletteRgb([{ value: -2000, color: '#000000' }, { value: -1900, color: '#ffffff' }], -1950))
      .toEqual([0.5, 0.5, 0.5])
    expect(DEFAULT_EXAGGERATION).toBe(1)
    expect([MESH_STRIDE_DESKTOP, MESH_STRIDE_NARROW]).toEqual([4, 8])
    const html = renderToStaticMarkup(<Terrain3D grid={synthetic()} palette={[]} profiles={[]} onClose={() => {}} />)
    expect(html).toContain('Escala vertical 1×')
    expect(html).toContain('Volver al mapa 2D')
    expect(html).toContain('No es navegación')
    expect(html).toContain('La ortoimagen CTX no se superpone')
  })
})

describe('full audited DTM in the integrated app', () => {
  const manifest = JSON.parse(readFileSync('public/data/manifest.json', 'utf8')) as DataManifest
  const binary = readFileSync('public/data/dtm/dtm_20m_f32le.bin')
  const bytes = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)
  const grid = gridFromInfo(manifest.elevation, new Float32Array(bytes))
  const mesh = buildTerrainMesh(grid, MESH_STRIDE_DESKTOP)

  it('keeps the source dimensions, heights and coverage without invented vertices', () => {
    expect(mesh.vertices).toBe(151600)
    expect(mesh.triangles).toBe(301644)
    expect(mesh.sourceNoData).toBe(0)
    expect(mesh.minElevation).toBeCloseTo(manifest.elevation.min_m, 3)
    expect(mesh.maxElevation).toBeCloseTo(manifest.elevation.max_m, 3)
    expect(mesh.physicalWidthKm).toBeCloseTo(30.27647646, 5)
    expect(mesh.physicalHeightKm).toBeCloseTo(30.24, 5)
    const cols = sampledIndices(grid.width, MESH_STRIDE_DESKTOP)
    const rows = sampledIndices(grid.height, MESH_STRIDE_DESKTOP)
    let mismatches = 0
    rows.forEach((row, r) => cols.forEach((col, c) => {
      if (mesh.elevations[r * cols.length + c] !== grid.values[row * grid.width + col]) mismatches++
    }))
    expect(mismatches).toBe(0)
  })
})
