import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { parseWaypoints } from '../src/data/waypoints'
import { associationText, locateSurfaceStations, nasaImage, SURFACE_STATIONS } from '../src/surface/stations'
import { SurfaceObservation, SurfaceStationList } from '../src/surface/SurfaceObservation'

const waypoints = parseWaypoints(JSON.parse(readFileSync(fileURLToPath(new URL('../public/data/waypoints/m20_waypoints.geojson', import.meta.url)), 'utf8')))
const located = locateSurfaceStations(waypoints)

describe('estaciones de superficie: asociación y recursos locales', () => {
  it('resuelve exactamente cuatro posiciones reales sin inventar geometrías ni cambiar el GeoJSON', () => {
    const before = JSON.stringify(waypoints)
    expect(located.map((s) => s.rmc)).toEqual(['33_366', '47_4404', '57_0', '64_0'])
    for (const s of located) expect(s.waypoint).toBe(waypoints.find((w) => w.rmc === s.rmc && w.sol === s.waypointSol))
    expect(JSON.stringify(waypoints)).toBe(before)
    expect(locateSurfaceStations([])).toEqual([])
    expect(locateSurfaceStations([{ ...waypoints.find((w) => w.rmc === '64_0')!, sol: 1356 }])).toEqual([])
  })
  it('comprueba el sol y RMC del nombre de cada imagen y sus dimensiones WebP reales', () => {
    for (const s of SURFACE_STATIONS) {
      const match = s.productId.match(/N(\d{3})(\d{4})(?:ZCAM|NCAM)/)!
      expect(`${Number(match[1])}_${Number(match[2])}`).toBe(s.rmc)
      expect(Number(s.productId.split('_')[1])).toBe(s.imageSol)
      const webp = readFileSync(fileURLToPath(new URL(`../public/surface/${s.productId}01.webp`, import.meta.url)))
      expect(webp.subarray(0, 4).toString()).toBe('RIFF')
      expect(webp.subarray(8, 16).toString()).toBe('WEBPVP8L')
      const dimensions = webp.readUInt32LE(21)
      expect([(dimensions & 0x3fff) + 1, ((dimensions >>> 14) & 0x3fff) + 1]).toEqual([s.width, s.height])
      expect(nasaImage(s)).toContain(`/sol/${String(s.imageSol).padStart(5, '0')}/`)
    }
  })
  it('descarta la imagen de cielo y conserva una Navcam del mismo sol y RMC', () => {
    const station = SURFACE_STATIONS.find((s) => s.rmc === '57_0')!
    expect(station.productId).toBe('NRF_1250_0777916348_292ECM_N0570000NCAM03250_04_195J')
    expect(station.credit).toBe('NASA/JPL-Caltech')
  })
  it('mantiene la diferencia entre posición sol 1354 e Imagen: sol 1356', () => {
    const station = located.find((s) => s.rmc === '64_0')!
    const html = renderToStaticMarkup(<SurfaceObservation station={station} onClose={() => {}} />)
    expect(html).toContain('Imagen: sol 1356')
    expect(html).toContain('Posición CANIS: sol 1354')
    expect(html).toContain('dos soles después')
    expect(html).toContain('no está delimitada sobre CTX')
  })
  it('muestra una sola foto local con crédito, fuente, límites y metadatos plegados', () => {
    for (const station of located) {
      const html = renderToStaticMarkup(<SurfaceObservation station={station} onClose={() => {}} />)
      expect((html.match(/<img /g) ?? []).length).toBe(1)
      expect(html).toContain('src="/surface/')
      expect(html).toContain(station.credit)
      expect(html).toContain('Ver fuente NASA')
      expect(html).toContain('<details>')
      expect(html).toContain('no evalúa seguridad ni transitabilidad')
      expect(html).toContain('La orientación no está determinada sobre CTX.')
      expect(associationText(station)).not.toContain('exactamente en este punto')
    }
  })
  it('permite acceder a las cuatro estaciones también mediante botones y no carga una galería', () => {
    const html = renderToStaticMarkup(<SurfaceStationList stations={located} onSelect={() => {}} />)
    expect((html.match(/<button /g) ?? []).length).toBe(4)
    expect(html).not.toContain('<img')
    expect(html).toContain('imagen sol 1356')
  })
})
