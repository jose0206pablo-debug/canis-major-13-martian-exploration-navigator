import { toProjected } from '../analysis/geodesy'
import { sampleBilinear, type ElevationGrid } from '../data/elevation'
import { isInterpolated, type Waypoint } from '../data/waypoints'
import { toTerrainPoint, type TerrainFrame } from './mesh'

/** Display the source localizations at DTM height. No connecting route is inferred. */
export function buildWaypointPoints(waypoints: readonly Waypoint[], grid: ElevationGrid, frame: TerrainFrame) {
  const measured: number[] = []
  const interpolated: number[] = []
  let withoutElevation = 0
  for (const waypoint of waypoints) {
    const { x, y } = toProjected(waypoint)
    const elevation = sampleBilinear(grid, x, y)
    if (elevation === null) { withoutElevation++; continue }
    const target = isInterpolated(waypoint) ? interpolated : measured
    target.push(...toTerrainPoint(frame, x, y, elevation))
  }
  return { measured: new Float32Array(measured), interpolated: new Float32Array(interpolated), withoutElevation }
}
