import proj4 from 'proj4'
import { describe, expect, it } from 'vitest'
import { greatCircleDistance, METERS_PER_DEGREE, toLonLat, toProjected } from '../src/analysis/geodesy'
import { MARS_PROJ4 } from '../src/data/mars-crs'

// Coordenadas geográficas sobre la misma esfera, para que proj4 no aplique ningún cambio de datum.
const MARS_GEOGRAPHIC = '+proj=longlat +a=3396190 +b=3396190 +no_defs'

describe('geodesia sobre la esfera marciana', () => {
  it('1° de latitud mide 59 274,697523 m (esfera de 3 396 190 m)', () => {
    expect(METERS_PER_DEGREE).toBeCloseTo(59274.697523, 5)
    expect(greatCircleDistance({ lon: 77.4, lat: 18 }, { lon: 77.4, lat: 19 })).toBeCloseTo(59274.697523, 4)
  })

  it('1° de longitud a 18,5° N mide 59 274,70 · cos(18,5°)', () => {
    // Sobre un paralelo, el círculo máximo es apenas más corto que el arco del paralelo (diferencia < 1 m en 1°).
    const d = greatCircleDistance({ lon: 77, lat: 18.5 }, { lon: 78, lat: 18.5 })
    expect(d).toBeCloseTo(59274.697523 * Math.cos((18.5 * Math.PI) / 180), -1)
  })

  it('es simétrica y nula para el mismo punto', () => {
    const a = { lon: 77.4508, lat: 18.4447 }, b = { lon: 77.37, lat: 18.51 }
    expect(greatCircleDistance(a, b)).toBeCloseTo(greatCircleDistance(b, a), 9)
    expect(greatCircleDistance(a, a)).toBe(0)
  })

  it('la conversión proyectado ↔ lon/lat coincide con proj4 (IAU_2015:49910)', () => {
    for (const p of [{ lon: 77.16046545922367, lat: 18.721194481872804 }, { lon: 77.4508, lat: 18.4447 }, { lon: 77.6989751662947, lat: 18.211027390963398 }]) {
      const [x, y] = proj4(MARS_GEOGRAPHIC, MARS_PROJ4, [p.lon, p.lat])
      const mine = toProjected(p)
      expect(mine.x).toBeCloseTo(x, 6)
      expect(mine.y).toBeCloseTo(y, 6)
      const back = toLonLat(mine)
      expect(back.lon).toBeCloseTo(p.lon, 12)
      expect(back.lat).toBeCloseTo(p.lat, 12)
    }
  })

  it('el aterrizaje cae en las coordenadas proyectadas verificadas con GDAL', () => {
    // Waypoint 3_0 (pruebas G1/G2): x 4590877.824, y 1093299.695.
    const p = toLonLat({ x: 4590877.824, y: 1093299.695 })
    expect(toProjected(p).x).toBeCloseTo(4590877.824, 6)
    expect(p.lat).toBeGreaterThan(18.44)
    expect(p.lat).toBeLessThan(18.45)
  })
})
