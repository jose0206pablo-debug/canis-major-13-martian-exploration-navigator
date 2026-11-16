import { validRuns, type ProfileResult } from '../analysis/profile'
import type { ElevationGrid } from '../data/elevation'
import type { PaletteStop } from '../data/manifest'
import { MARS_SPHERE_RADIUS } from '../data/mars-crs'

/** Local tangent approximation, in kilometres, shared by terrain and profile annotations. */
export interface TerrainFrame {
  centerX: number
  centerY: number
  baseElevation: number
  eastWestFactor: number
}

export interface TerrainMesh extends TerrainFrame {
  positions: Float32Array
  uvs: Float32Array
  elevations: Float32Array
  indices: Uint32Array
  cols: number
  rows: number
  stride: number
  vertices: number
  triangles: number
  sourceNoData: number
  noDataNodes: number
  skippedQuads: number
  minElevation: number
  maxElevation: number
  physicalWidthKm: number
  physicalHeightKm: number
}

const isValid = (grid: ElevationGrid, value: number) =>
  Number.isFinite(value) && (grid.nodata === null || value !== Math.fround(grid.nodata))

export function sampledIndices(size: number, stride: number): number[] {
  const indices: number[] = []
  for (let i = 0; i < size; i += stride) indices.push(i)
  if (indices.at(-1) !== size - 1) indices.push(size - 1)
  return indices
}

/** Projected EQC metres -> local kilometres. X east, Y up, Z south. */
export function toTerrainPoint(frame: TerrainFrame, x: number, y: number, elevation: number): [number, number, number] {
  return [
    (x - frame.centerX) * frame.eastWestFactor / 1000,
    (elevation - frame.baseElevation) / 1000,
    (frame.centerY - y) / 1000,
  ]
}

/** Each vertex samples exactly one original DTM pixel centre. No heights are fabricated. */
export function buildTerrainMesh(grid: ElevationGrid, stride: number): TerrainMesh {
  if (!Number.isInteger(stride) || stride < 1) throw new Error('Invalid terrain stride')
  if (grid.width < 2 || grid.height < 2 || grid.values.length !== grid.width * grid.height) {
    throw new Error('Invalid DTM dimensions')
  }
  const colsIndex = sampledIndices(grid.width, stride)
  const rowsIndex = sampledIndices(grid.height, stride)
  const cols = colsIndex.length
  const rows = rowsIndex.length
  const centerX = grid.originX + grid.width * grid.pixelSize / 2
  const centerY = grid.originY - grid.height * grid.pixelSize / 2
  // EQC with lat_ts=0: projected east-west metres exceed local ground metres by 1/cos(latitude).
  const eastWestFactor = Math.cos(centerY / MARS_SPHERE_RADIUS)
  let minElevation = Infinity
  let maxElevation = -Infinity
  let sourceNoData = 0
  for (const value of grid.values) {
    if (!isValid(grid, value)) { sourceNoData++; continue }
    minElevation = Math.min(minElevation, value)
    maxElevation = Math.max(maxElevation, value)
  }
  if (!Number.isFinite(minElevation)) throw new Error('DTM contains no valid heights')
  const baseElevation = (minElevation + maxElevation) / 2
  const frame = { centerX, centerY, baseElevation, eastWestFactor }
  const positions = new Float32Array(cols * rows * 3)
  const uvs = new Float32Array(cols * rows * 2)
  const elevations = new Float32Array(cols * rows)
  let noDataNodes = 0
  for (let row = 0; row < rows; row++) {
    const sourceRow = rowsIndex[row]
    for (let col = 0; col < cols; col++) {
      const sourceCol = colsIndex[col]
      const vertex = row * cols + col
      const value = grid.values[sourceRow * grid.width + sourceCol]
      const valid = isValid(grid, value)
      elevations[vertex] = valid ? value : NaN
      if (!valid) noDataNodes++
      const x = grid.originX + (sourceCol + 0.5) * grid.pixelSize
      const y = grid.originY - (sourceRow + 0.5) * grid.pixelSize
      positions.set(toTerrainPoint(frame, x, y, valid ? value : baseElevation), vertex * 3)
      uvs[vertex * 2] = (sourceCol + 0.5) / grid.width
      uvs[vertex * 2 + 1] = 1 - (sourceRow + 0.5) / grid.height
    }
  }
  const triangles: number[] = []
  let skippedQuads = 0
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      // Check the entire original DTM area inside each coarse mesh quad.
      // A missing cell between sampled vertices must not be bridged.
      let missing = false
      if (sourceNoData > 0) {
        for (let r = rowsIndex[row]; r <= rowsIndex[row + 1] && !missing; r++) {
          for (let c = colsIndex[col]; c <= colsIndex[col + 1]; c++) {
            if (!isValid(grid, grid.values[r * grid.width + c])) { missing = true; break }
          }
        }
      }
      if (missing) { skippedQuads++; continue }
      const a = row * cols + col
      const b = a + 1
      const south = a + cols
      const southeast = south + 1
      triangles.push(a, south, b, b, south, southeast)
    }
  }
  const indices = Uint32Array.from(triangles)
  return {
    ...frame, positions, uvs, elevations, indices, cols, rows, stride,
    vertices: cols * rows, triangles: indices.length / 3,
    sourceNoData, noDataNodes, skippedQuads, minElevation, maxElevation,
    physicalWidthKm: grid.width * grid.pixelSize * eastWestFactor / 1000,
    physicalHeightKm: grid.height * grid.pixelSize / 1000,
  }
}

/** Uses the already calculated 2D profile samples; gaps remain separate line runs. */
export function profileRunsTo3D(profile: ProfileResult, frame: TerrainFrame): Float32Array[] {
  return validRuns(profile.samples)
    .filter((run) => run.length >= 2)
    .map((run) => {
      const points = new Float32Array(run.length * 3)
      run.forEach((sample, index) => {
        points.set(toTerrainPoint(frame, sample.x, sample.y, sample.elevation!), index * 3)
      })
      return points
    })
}

export function paletteRgb(stops: readonly PaletteStop[], value: number): [number, number, number] {
  const rgb = (hex: string): [number, number, number] =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
  if (!stops.length || !Number.isFinite(value)) return [0.5, 0.5, 0.5]
  if (value <= stops[0].value) return rgb(stops[0].color)
  for (let index = 1; index < stops.length; index++) {
    if (value <= stops[index].value) {
      const a = stops[index - 1], b = stops[index]
      const fraction = (value - a.value) / (b.value - a.value)
      const ca = rgb(a.color), cb = rgb(b.color)
      return [0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * fraction) as [number, number, number]
    }
  }
  return rgb(stops.at(-1)!.color)
}

export function meshColors(mesh: TerrainMesh, stops: readonly PaletteStop[]): Float32Array {
  const colors = new Float32Array(mesh.vertices * 3)
  for (let vertex = 0; vertex < mesh.vertices; vertex++) {
    colors.set(paletteRgb(stops, mesh.elevations[vertex]), vertex * 3)
  }
  return colors
}
