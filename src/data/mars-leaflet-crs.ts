import L from 'leaflet'
import 'proj4leaflet'
import { MARS_CRS_BOUNDS, MARS_CRS_NAME, MARS_CRS_ORIGIN, MARS_CRS_RESOLUTIONS, MARS_PROJ4, MARS_SPHERE_RADIUS } from './mars-crs'

type ProjCrsOptions = { origin: [number, number]; resolutions: number[]; bounds: L.Bounds }
type ProjCrs = L.CRS & { R: number }
type ProjCrsConstructor = new (code: string, proj4def: string, options: ProjCrsOptions) => ProjCrs

export function createMarsCrs(): ProjCrs {
  const { CRS } = (L as unknown as { Proj: { CRS: ProjCrsConstructor } }).Proj
  const crs = new CRS(MARS_CRS_NAME, MARS_PROJ4, {
    origin: MARS_CRS_ORIGIN,
    resolutions: MARS_CRS_RESOLUTIONS,
    bounds: L.bounds([MARS_CRS_BOUNDS.west, MARS_CRS_BOUNDS.south], [MARS_CRS_BOUNDS.east, MARS_CRS_BOUNDS.north]),
  })
  // proj4leaflet hereda R = 6 371 000 m de la Tierra; sin esto la escala y las distancias serían terrestres.
  crs.R = MARS_SPHERE_RADIUS
  return crs
}
