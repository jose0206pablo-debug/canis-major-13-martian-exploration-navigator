import proj4 from 'proj4'
import { describe, expect, it } from 'vitest'
import { MARS_CRS_BOUNDS, MARS_CRS_ORIGIN, MARS_CRS_RESOLUTIONS, MARS_PROJ4, MARS_SPHERE_RADIUS, ORTHO_NATIVE_ZOOM } from '../src/data/mars-crs'

// Valores de referencia: etiquetas PDS3 de D-001/D-004 y salidas de gdalinfo/cs2cs (03_DATOS/validacion_gdal/).
const toXY = (lon: number, lat: number) => proj4(MARS_PROJ4, [lon, lat])
const toLonLat = (x: number, y: number) => proj4(MARS_PROJ4).inverse([x, y])

describe('CRS marciano IAU_2015:49910', () => {
  it('usa la esfera de 3 396 190 m: 1° = 59 274,697523 m', () => {
    expect(MARS_SPHERE_RADIUS * Math.PI / 180).toBeCloseTo(59274.697523, 6)
    const [x1] = toXY(1, 0)
    expect(x1).toBeCloseTo(59274.697523, 5)
  })

  it('proyecta la esquina superior izquierda de las etiquetas PDS3 en el origen de GDAL', () => {
    const [x, y] = toXY(77.16046545922367, 18.721194481872804)
    expect(Math.abs(x - MARS_CRS_ORIGIN[0])).toBeLessThan(0.001)
    expect(Math.abs(y - MARS_CRS_ORIGIN[1])).toBeLessThan(0.001)
  })

  it('proyecta el borde este del DTM y del ortomosaico (12 m de diferencia)', () => {
    const [xDtm, ySouth] = toXY(77.6989751662947, 18.211027390963398)
    const [xOrtho] = toXY(77.69917761355299, 18.211027390963398)
    expect(xDtm).toBeCloseTo(4605583.250853, 2)
    expect(xOrtho).toBeCloseTo(MARS_CRS_BOUNDS.east, 2)
    expect(ySouth).toBeCloseTo(MARS_CRS_BOUNDS.south, 2)
    expect(xOrtho - xDtm).toBeCloseTo(12, 2)
  })

  it('proyecta el aterrizaje de Perseverance (waypoint 3_0) como en las pruebas G1/G2', () => {
    const [x, y] = toXY(77.45088572, 18.44462715)
    expect(Math.abs(x - 4590877.824)).toBeLessThan(0.01)
    expect(Math.abs(y - 1093299.695)).toBeLessThan(0.01)
    const [lon, lat] = toLonLat(x, y)
    expect(lon).toBeCloseTo(77.45088572, 9)
    expect(lat).toBeCloseTo(18.44462715, 9)
  })

  it('define resoluciones que se duplican hasta los 6 m nativos del ortomosaico', () => {
    expect(MARS_CRS_RESOLUTIONS[ORTHO_NATIVE_ZOOM]).toBe(6)
    MARS_CRS_RESOLUTIONS.slice(1).forEach((res, i) => expect(MARS_CRS_RESOLUTIONS[i] / res).toBe(2))
    expect(MARS_CRS_ORIGIN).toEqual([MARS_CRS_BOUNDS.west, MARS_CRS_BOUNDS.north])
  })
})
