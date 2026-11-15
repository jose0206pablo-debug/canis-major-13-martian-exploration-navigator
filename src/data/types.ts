export type EvidenceState = 'IDENTIFIED' | 'METADATA_VERIFIED' | 'DOWNLOADED' | 'PROCESSED' | 'SPATIALLY_VALIDATED' | 'INTEGRATED' | 'TESTED' | 'DERIVED' | 'PRACTICE' | 'UNVALIDATED'
export type Bounds = { north: number; south: number; east: number; west: number }
export type DataCategory = 'measured' | 'derived' | 'contextual'
export interface Source { id: string; name: string; organism: string; productId?: string; url?: string; attribution: string; limitations: string[] }
export type RasterLayerId = 'ctx_ortho' | 'ctx_dtm_relief' | 'ctx_dtm_hillshade'
export type LegendKind = 'ortho' | 'elevation' | 'hillshade' | 'marker' | 'waypoints' | 'none'
export interface Layer {
  id: string
  name: string
  description: string
  type: 'tiles' | 'image' | 'geojson' | 'candidate' | 'vector'
  sourceId: string
  category: DataCategory
  evidenceState: EvidenceState
  visibleDefault: boolean
  defaultOpacity: number
  renderable: boolean
  legend: LegendKind
  disclaimer?: string
}
export interface PointOfInterest { id: string; name: string; description: string; category: 'mission' | 'practice' | 'geological' | 'topographic'; coordinates: { lat: number; lon: number }; sourceId: string; evidenceState: EvidenceState; limitations: string[] }
export interface MapPoint {
  kind: 'map-point'
  coordinates: { lat: number; lon: number }
  projected: { x: number; y: number }
  elevation: number | null | undefined
  evidenceState: 'DERIVED'
}
export interface WaypointSelection {
  kind: 'waypoint'
  waypoint: import('./waypoints').Waypoint
  projected: { x: number; y: number }
  dtmElevation: number | null | undefined
}
export type Selection = MapPoint | PointOfInterest | WaypointSelection
export interface Catalog { region: string; bounds: Bounds; sources: Source[]; layers: Layer[]; pois: PointOfInterest[] }
