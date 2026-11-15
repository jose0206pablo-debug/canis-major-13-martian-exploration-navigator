import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { JEZERO_NOMINAL, nominalDiskPolygon, SECTOR_A_EXTENT } from '../src/analysis/context'
import { greatCircleDistance, toProjected } from '../src/analysis/geodesy'
import { selectIllustrativeRoute } from '../src/analysis/illustrative'
import { computeProfile } from '../src/analysis/profile'
import { DisclaimerBanner, ScopeContent } from '../src/components/DisclaimerBanner'
import { SAFEGUARD_LEAD, SAFEGUARD_TEXT, SCOPE_BLOCKS, SCOPE_MORE, SCOPE_NOT_CERTIFIED } from '../src/data/safeguards'
import { sampleBilinear, type ElevationGrid } from '../src/data/elevation'
import { SCIENTIFIC_LIMITS } from '../src/data/safeguards'
import { parseWaypoints, type Waypoint } from '../src/data/waypoints'

describe('disco nominal de Jezero (V1.1, A1e)', () => {
  it('todos los vértices están a 23,76 km del centro del Gazetteer', () => {
    for (const p of nominalDiskPolygon(72)) expect(greatCircleDistance(JEZERO_NOMINAL.center, p)).toBeCloseTo(23760, 3)
  })

  it('su recuadro coincide con los límites que publica el Gazetteer (N 18,81 · S 18,01 · E 78,11 · W 77,27)', () => {
    const poly = nominalDiskPolygon(360)
    expect(Math.max(...poly.map((p) => p.lat))).toBeCloseTo(18.81, 2)
    expect(Math.min(...poly.map((p) => p.lat))).toBeCloseTo(18.01, 2)
    expect(Math.max(...poly.map((p) => p.lon))).toBeCloseTo(78.11, 2)
    expect(Math.min(...poly.map((p) => p.lon))).toBeCloseTo(77.27, 2)
  })

  it('el Sector A usa la extensión PDS3 de D-001', () => {
    expect(SECTOR_A_EXTENT.west).toBeCloseTo(77.16046546, 8)
    expect(SECTOR_A_EXTENT.north).toBeCloseTo(18.72119448, 8)
  })
})

describe('salvaguarda (V1.1–V1.3)', () => {
  // V1.4: las pruebas del antiguo localizador pasan a tests/planetary-entry.test.tsx (entrada planetaria y contexto compacto).
  it('V1.5.1c: indicador compacto de alcance y ficha con los cuatro bloques y toda la información científica', () => {
    // V1.5.2 · Estado inicial (popover cerrado): SOLO el indicador está en el DOM, y la no certificación
    // es visible permanentemente, sin hover, sin clic y sin abrir ningún desplegable.
    const header = renderToStaticMarkup(<DisclaimerBanner />)
    expect(header).toContain('ANÁLISIS PRELIMINAR')
    expect(header).toContain(SCOPE_NOT_CERTIFIED)
    expect(SCOPE_NOT_CERTIFIED).toBe('No es navegación certificada')
    expect(header).toContain('Alcance y límites')
    expect(header).not.toContain('scope-popover') // cerrado: el texto no depende del popover
    expect(header).not.toContain('<details') // ni de ningún desplegable
    expect(header).toContain('aria-haspopup="dialog"')
    const html = renderToStaticMarkup(<ScopeContent />)
    expect(SCOPE_BLOCKS.map((b) => b.title)).toEqual(['Análisis topográfico preliminar', 'Escala de análisis', 'Registro y elevación', 'Cobertura y trazabilidad'])
    for (const b of SCOPE_BLOCKS) { expect(html).toContain(b.title); expect(html).toContain(b.body) }
    expect(html).toContain(SCOPE_MORE)
    expect(html).toContain(SAFEGUARD_LEAD)
    expect(html).toContain(SAFEGUARD_TEXT)
    for (const word of ['seguridad', 'habitabilidad', 'transitabilidad', 'movilidad de astronautas']) expect(SAFEGUARD_TEXT).toContain(word)
    expect(SAFEGUARD_TEXT).toContain('no es navegación certificada') // la afirmación provisional no pasa a certificada
    for (const item of SCIENTIFIC_LIMITS) expect(html).toContain(item)
    expect(html).toContain('30–40 m')
    expect(html).toContain('revisión independiente pendiente')
  })
})

const wp = (rmc: string, sol: number, elev: number, note = 'End-of-drive localization', lon = 77.4, lat = 18.45): Waypoint =>
  ({ rmc, site: 0, drive: 0, sol, lon, lat, elevGeoid: elev, distTotalM: 0, final: '', note })

describe('regla del recorrido ilustrativo (V1.1, Bi)', () => {
  it('inicio = RMC 3_0; destino = posición NO interpolada con mayor elevación publicada', () => {
    const r = selectIllustrativeRoute([wp('3_0', 13, -2569.9), wp('9_0', 50, -2000, 'Interpolated'), wp('8_0', 40, -2100), wp('7_0', 30, -2300)])
    expect(r?.start.rmc).toBe('3_0')
    expect(r?.end.rmc).toBe('8_0') // la interpolada más alta se excluye
  })

  it('en empate se queda con la primera del archivo y devuelve null si falta el inicio', () => {
    expect(selectIllustrativeRoute([wp('3_0', 13, -2500), wp('a', 20, -2000), wp('b', 21, -2000)])?.end.rmc).toBe('a')
    expect(selectIllustrativeRoute([wp('x', 20, -2000)])).toBeNull()
  })
})

const data = (p: string) => fileURLToPath(new URL(`../public/data/${p}`, import.meta.url))

describe.skipIf(!existsSync(data('manifest.json')))('recorrido ilustrativo sobre los datos reales (V1.1)', () => {
  const manifest = JSON.parse(readFileSync(data('manifest.json'), 'utf-8'))
  const waypoints = parseWaypoints(JSON.parse(readFileSync(data(manifest.waypoints.url), 'utf-8')))
  const route = selectIllustrativeRoute(waypoints)

  it('selecciona sol 13 / 3_0 → sol 1354 / 64_0 (−1786,0 m)', () => {
    expect(waypoints).toHaveLength(708)
    expect(route?.start).toMatchObject({ rmc: '3_0', sol: 13 })
    expect(route?.end).toMatchObject({ rmc: '64_0', sol: 1354 })
    expect(route?.end.elevGeoid).toBeCloseTo(-1785.999, 2)
  })

  it('su perfil se calcula con el código validado: 10 282,1 m horizontales, sin tramos sin dato', () => {
    const info = manifest.elevation
    const bytes = readFileSync(data(info.url))
    const [originX, pixelSize, , originY] = info.geotransform
    const grid: ElevationGrid = { width: info.width, height: info.height, originX, originY, pixelSize, nodata: info.nodata, values: new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4) }
    const p = computeProfile(route!.vertices.map(toProjected), (x, y) => sampleBilinear(grid, x, y))
    // Referencia independiente: haversine directo entre los dos extremos (Python): 10 282,1 m.
    expect(p.totalDistance).toBeGreaterThan(10281.5)
    expect(p.totalDistance).toBeLessThan(10282.7)
    expect(p.noDataPercent).toBe(0)
    expect(p.endElevation! - p.startElevation!).toBeGreaterThan(600) // asciende hacia el destino
  })
})
