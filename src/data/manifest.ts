import type { RasterLayerId } from './types'

// Estructura de public/data/manifest.json, escrito por 05_PROTOTIPO/procesamiento/generar_derivados.py.
export type ProjectedBounds = { west: number; south: number; east: number; north: number }
export interface PaletteStop { value: number; color: string }
export interface ManifestLayer { source: string; kind: 'tiles' | 'image'; url: string; bounds_m: ProjectedBounds; method: string; tile_size?: number; min_zoom?: number; max_native_zoom?: number; palette?: PaletteStop[]; note?: string }
export interface ElevationInfo { source: string; url: string; dtype: 'float32-le'; width: number; height: number; geotransform: number[]; nodata: number | null; min_m: number; max_m: number; vertical_reference: string }
export interface WaypointsInfo {
  source: string
  url: string
  source_url: string
  verification: { count: number; sol_range: [number, number]; dtm_minus_elev_geoid_m: { median: number; std: number; min: number; max: number } }
}
export interface DataManifest {
  generated_at: string
  gdal_version: string
  sources: Record<string, { file: string; sha256_after: string; unchanged: boolean }>
  layers: Record<RasterLayerId, ManifestLayer>
  elevation: ElevationInfo
  waypoints?: WaypointsInfo
}

export const dataUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`

export async function loadManifest(): Promise<DataManifest | null> {
  try {
    const response = await fetch(dataUrl('manifest.json'))
    if (!response.ok) return null
    return (await response.json()) as DataManifest
  } catch {
    return null
  }
}
