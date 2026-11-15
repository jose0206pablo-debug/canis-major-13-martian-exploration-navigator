import { dataUrl, type ElevationInfo } from './manifest'

export interface ElevationGrid { width: number; height: number; originX: number; originY: number; pixelSize: number; nodata: number | null; values: Float32Array }

export function gridFromInfo(info: ElevationInfo, values: Float32Array): ElevationGrid {
  const [originX, pixelSize, , originY] = info.geotransform
  return { width: info.width, height: info.height, originX, originY, pixelSize, nodata: info.nodata, values }
}

function readFloat32LE(buffer: ArrayBuffer): Float32Array {
  if (new Uint8Array(new Uint16Array([1]).buffer)[0] === 1) return new Float32Array(buffer)
  const view = new DataView(buffer)
  return Float32Array.from({ length: buffer.byteLength / 4 }, (_, i) => view.getFloat32(i * 4, true))
}

export async function loadElevationGrid(info: ElevationInfo): Promise<ElevationGrid> {
  const response = await fetch(dataUrl(info.url))
  if (!response.ok) throw new Error(`No se pudo cargar ${info.url} (${response.status})`)
  const values = readFloat32LE(await response.arrayBuffer())
  if (values.length !== info.width * info.height) throw new Error(`Tamaño inesperado de ${info.url}: ${values.length} valores`)
  return gridFromInfo(info, values)
}

const isValid = (grid: ElevationGrid, v: number) => Number.isFinite(v) && (grid.nodata === null || v !== Math.fround(grid.nodata))

/** Valor del píxel que contiene (x, y) en metros proyectados; null fuera de la extensión o en NoData. */
export function pixelValue(grid: ElevationGrid, x: number, y: number): number | null {
  const col = Math.floor((x - grid.originX) / grid.pixelSize)
  const row = Math.floor((grid.originY - y) / grid.pixelSize)
  if (col < 0 || row < 0 || col >= grid.width || row >= grid.height) return null
  const v = grid.values[row * grid.width + col]
  return isValid(grid, v) ? v : null
}

/** Interpolación bilineal entre centros de píxel; null fuera de la extensión o si algún vecino es NoData. */
export function sampleBilinear(grid: ElevationGrid, x: number, y: number): number | null {
  const fx = (x - grid.originX) / grid.pixelSize
  const fy = (grid.originY - y) / grid.pixelSize
  if (fx < 0 || fy < 0 || fx > grid.width || fy > grid.height) return null
  const cx = Math.min(Math.max(fx - 0.5, 0), grid.width - 1)
  const cy = Math.min(Math.max(fy - 0.5, 0), grid.height - 1)
  const c0 = Math.min(Math.floor(cx), grid.width - 2), r0 = Math.min(Math.floor(cy), grid.height - 2)
  const tx = cx - c0, ty = cy - r0
  const at = (c: number, r: number) => grid.values[r * grid.width + c]
  const v00 = at(c0, r0), v10 = at(c0 + 1, r0), v01 = at(c0, r0 + 1), v11 = at(c0 + 1, r0 + 1)
  if (![v00, v10, v01, v11].every((v) => isValid(grid, v))) return null
  return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
}
