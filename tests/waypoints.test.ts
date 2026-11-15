import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sampleBilinear, type ElevationGrid } from '../src/data/elevation'
import { MARS_CRS_BOUNDS, MARS_SPHERE_RADIUS } from '../src/data/mars-crs'
import { isInterpolated, localizationLabel, parseWaypoints } from '../src/data/waypoints'

describe('lectura de waypoints', () => {
  it('usa la geometría lon/lat, ignora easting/northing y descarta entidades incompletas', () => {
    const parsed = parseWaypoints({ features: [
      { geometry: { type: 'Point', coordinates: [77.45088572, 18.44462715] }, properties: { RMC: '3_0', site: 3, drive: 0, sol: 13, elev_geoid: -2569.91, dist_total_m: 0, final: 'y', Note: 'First localization!', easting: 4354494.086 } },
      { geometry: { type: 'Point', coordinates: [77.4, 18.4] }, properties: { RMC: '4_0', sol: 20 } },
      { geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: { RMC: '5_0', sol: 21, elev_geoid: -2500 } },
    ] })
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({ rmc: '3_0', sol: 13, lon: 77.45088572, lat: 18.44462715, elevGeoid: -2569.91 })
  })

  it('identifica las posiciones interpoladas y traduce el tipo de localización', () => {
    const [w] = parseWaypoints({ features: [{ geometry: { type: 'Point', coordinates: [77.4, 18.4] }, properties: { RMC: '9_9', sol: 99, elev_geoid: -2500, Note: 'Interpolated' } }] })
    expect(isInterpolated(w)).toBe(true)
    expect(localizationLabel('Interpolated')).toMatch(/no medida/)
  })
})

const dataDir = fileURLToPath(new URL('../public/data/', import.meta.url))
const hasData = existsSync(`${dataDir}waypoints/m20_waypoints.geojson`) && existsSync(`${dataDir}manifest.json`)

describe.skipIf(!hasData)('waypoints reales D-005 (requiere generar_derivados)', () => {
  it('contienen 708 posiciones dentro del Sector A cuya altura coincide con el DTM', () => {
    const waypoints = parseWaypoints(JSON.parse(readFileSync(`${dataDir}waypoints/m20_waypoints.geojson`, 'utf-8')))
    expect(waypoints).toHaveLength(708)
    expect(waypoints[0]).toMatchObject({ rmc: '3_0', sol: 13, lon: 77.45088572, lat: 18.44462715 })
    const mpd = MARS_SPHERE_RADIUS * Math.PI / 180
    const xy = waypoints.map((w) => [w.lon * mpd, w.lat * mpd])
    expect(xy.every(([x, y]) => x >= MARS_CRS_BOUNDS.west && x <= MARS_CRS_BOUNDS.east && y >= MARS_CRS_BOUNDS.south && y <= MARS_CRS_BOUNDS.north)).toBe(true)

    const info = JSON.parse(readFileSync(`${dataDir}manifest.json`, 'utf-8')).elevation
    const bytes = readFileSync(`${dataDir}${info.url}`)
    const [originX, pixelSize, , originY] = info.geotransform
    const grid: ElevationGrid = { width: info.width, height: info.height, originX, originY, pixelSize, nodata: info.nodata, values: new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4) }
    const diffs = waypoints.map((w, i) => (sampleBilinear(grid, xy[i][0], xy[i][1]) as number) - w.elevGeoid).sort((a, b) => a - b)
    const median = diffs[Math.floor(diffs.length / 2)]
    expect(Math.abs(median)).toBeLessThan(3)
    expect(diffs.filter((d) => Math.abs(d) <= 10).length).toBeGreaterThanOrEqual(700)
  })
})
