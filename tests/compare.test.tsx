import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { compareScenarios, finishAlternative, sharedProfileScale, sharesEndpoints, startAlternative } from '../src/analysis/compare'
import { toProjected, type Projected } from '../src/analysis/geodesy'
import { selectIllustrativeRoute } from '../src/analysis/illustrative'
import { computeProfile, PROFILE_SENSITIVITY_STEP_M, type ElevationSampler } from '../src/analysis/profile'
import { ProfileChart } from '../src/components/ProfileChart'
import { COMPARE_STATEMENT, RoutePanel, SCENARIOS_NOT } from '../src/components/RoutePanel'
import { sampleBilinear, type ElevationGrid } from '../src/data/elevation'
import { parseWaypoints } from '../src/data/waypoints'

// Vocabulario que la conclusión y la tabla NO pueden usar (V1.3).
const FORBIDDEN = ['mejor', 'peor', 'recomend', 'óptim', 'optim', 'segur', 'peligro', 'transitable']
const pair = (v: Projected[], s: ElevationSampler) => ({ main: computeProfile(v, s), sens: computeProfile(v, s, PROFILE_SENSITIVITY_STEP_M) })
const cmp = (a: ReturnType<typeof pair>, b: ReturnType<typeof pair>) => compareScenarios(a.main, a.sens, b.main, b.sens)

// Escenarios sintéticos en el ecuador: A recto de 1 km; B con desvío (más largo).
const A = [{ x: 0, y: 0 }, { x: 1000, y: 0 }]
const B = [{ x: 0, y: 0 }, { x: 500, y: 600 }, { x: 1000, y: 0 }]
const ramp: ElevationSampler = (x) => 0.1 * x // sube 100 m de forma regular
const hill: ElevationSampler = (x, y) => 0.1 * x + 0.2 * y // el desvío sube y baja más

describe('alternativa B: extremos comunes con A (V1.3)', () => {
  const origin = { lon: 77.45, lat: 18.44 }, destination = { lon: 77.36, lat: 18.48 }
  it('empieza exactamente en el origen de A y «Terminar en destino» añade exactamente el destino de A', () => {
    const drawn = [...startAlternative(origin), { lon: 77.40, lat: 18.47 }]
    const b = finishAlternative(drawn, origin, destination)
    expect(b[0]).toEqual(origin)
    expect(b[b.length - 1]).toEqual(destination)
    expect(b).toHaveLength(3)
    expect(sharesEndpoints([origin, destination], b)).toBe(true)
  })
  it('restablece el origen común aunque la lista llegue sin él y detecta extremos distintos', () => {
    const b = finishAlternative([{ lon: 77.40, lat: 18.47 }], origin, destination)
    expect(b[0]).toEqual(origin)
    expect(sharesEndpoints([origin, destination], [origin, { lon: 77.3, lat: 18.4 }])).toBe(false)
  })
})

describe('comparación de métricas topográficas (V1.3)', () => {
  it('B más largo y con más ascenso/descenso: diferencias B − A y conclusión descriptiva', () => {
    const r = cmp(pair(A, ramp), pair(B, hill))
    expect(r.distance.verdict).toBe('more')
    expect(r.distance.delta).toBeCloseTo(r.distance.b - r.distance.a, 9)
    expect(r.gain.verdict).toBe('more')
    expect(r.loss.verdict).toBe('more')
    expect(r.noDataAffects).toBe(false)
    expect(r.sentence).toMatch(/^B recorre \d+ m más que A, acumula [\d.]+ m más de ascenso y [\d.]+ m más de descenso\.$/)
  })

  it('una diferencia dentro de la sensibilidad al muestreo se declara «no distinguible con este muestreo»', () => {
    const r = cmp(pair(A, ramp), pair(A, ramp))
    expect(r.distance.verdict).toBe('same')
    expect(r.gain.verdict).toBe('same')
    expect(r.sentence).toBe('B recorre la misma distancia horizontal que A, acumula una diferencia de ascenso no distinguible con este muestreo y una diferencia de descenso no distinguible con este muestreo.')
  })

  it('con tramos sin dato no concluye nada sobre ascenso ni descenso', () => {
    const r = cmp(pair(A, ramp), pair(B, (x, y) => (x > 700 ? null : hill(x, y))))
    expect(r.noDataAffects).toBe(true)
    expect(r.noData.b).toBeGreaterThan(0)
    expect(r.sentence).toContain('no se comparan porque A o B tiene tramos sin datos del DTM')
    expect(r.sentence).not.toMatch(/de ascenso|de descenso/)
  })

  it('ninguna conclusión usa vocabulario de valoración (mejor, recomendado, óptimo, seguro, peligroso, transitable)', () => {
    const samplers: ElevationSampler[] = [ramp, hill, (x) => -0.1 * x, () => 5, (x) => (x > 700 ? null : 0)]
    for (const sa of samplers) for (const sb of samplers) for (const [va, vb] of [[A, B], [B, A], [A, A]]) {
      const text = cmp(pair(va, sa), pair(vb, sb)).sentence.toLowerCase()
      for (const w of FORBIDDEN) expect(text).not.toContain(w)
    }
  })

  it('escala compartida: cubre el rango vertical de A y B y la mayor longitud horizontal', () => {
    const a = computeProfile(A, ramp), b = computeProfile(B, hill)
    const s = sharedProfileScale(a, b)!
    expect(s.y0).toBeLessThan(Math.min(a.minElevation!, b.minElevation!))
    expect(s.y1).toBeGreaterThan(Math.max(a.maxElevation!, b.maxElevation!))
    expect(s.distance).toBe(Math.max(a.totalDistance, b.totalDistance))
    expect(sharedProfileScale(computeProfile(A, () => null), computeProfile(A, () => null))).toBeNull()
    // Con la escala compartida, el perfil más corto no ocupa todo el ancho del gráfico.
    const html = renderToStaticMarkup(<ProfileChart profile={a} scale={s} label="Escenario A" />)
    const xs = [...html.matchAll(/[ML]([\d.]+),/g)].map((m) => Number(m[1]))
    expect(Math.max(...xs)).toBeLessThan(52 + 256 - 1) // margen izquierdo + ancho útil
    expect(html).toContain('Escenario A: perfil de elevación')
  })
})

describe('panel de comparación (V1.3)', () => {
  const info = { available: true, active: false, start: { rmc: '3_0', sol: 13 }, end: { rmc: '64_0', sol: 1354, elevGeoid: -1785.999 } }
  const a = pair(A, ramp), b = pair(B, hill)
  const comparison = { result: cmp(a, b), a: a.main, b: b.main, scale: sharedProfileScale(a.main, b.main) }
  const render = (props: Partial<Parameters<typeof RoutePanel>[0]>) => renderToStaticMarkup(
    <RoutePanel mode="done" vertexCount={3} profile={b.main} sensitivity={b.sens} gridStatus="ready" onStart={() => undefined} onFinish={() => undefined} onClear={() => undefined}
      illustrative={info} onShowIllustrative={() => undefined} onStartAlternative={() => undefined} alternativeActive {...props} />)

  it('muestra la frase permanente, la tabla A/B, los dos perfiles en la misma escala y qué es cada línea', () => {
    const html = render({ comparison })
    expect(html).toContain(COMPARE_STATEMENT)
    expect(COMPARE_STATEMENT).toBe('CANIS compara métricas topográficas; no elige ni certifica recorridos.')
    for (const row of ['Distancia horizontal', 'Ascenso acumulado', 'Descenso acumulado', 'Sin datos del DTM', 'Diferencia (B − A)']) expect(html).toContain(row)
    expect(html).toContain(comparison.result.sentence)
    expect(html.match(/class="profile-chart"/g)).toHaveLength(2)
    expect(html).toContain('misma escala vertical')
    expect(html).toContain('construcción ilustrativa de CANIS')
    expect(html).toContain('alternativa trazada por ti')
    expect(html).toContain('datos de misión')
    expect(html).toContain(SCENARIOS_NOT)
    // La tabla y la conclusión no valoran.
    const block = html.slice(html.indexOf('<section class="comparison"'), html.indexOf('</section>', html.indexOf('<section class="comparison"'))).replace(/<[^>]+>/g, ' ').toLowerCase()
    for (const w of FORBIDDEN) expect(block).not.toContain(w)
  })

  it('al trazar B: «Terminar en destino» y «Deshacer punto», sin perfil parcial ni comparación', () => {
    const html = render({ mode: 'drawing', vertexCount: 1, onUndo: () => undefined, comparison: null })
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Terminar en destino/)
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Deshacer punto/)
    expect(html).toContain('el origen de A ya está fijado')
    expect(html).not.toContain('class="profile-chart"')
    expect(render({ mode: 'drawing', vertexCount: 3, onUndo: () => undefined, comparison: null })).not.toMatch(/<button[^>]*disabled[^>]*>Terminar en destino/)
  })
})

const data = (p: string) => fileURLToPath(new URL(`../public/data/${p}`, import.meta.url))

describe.skipIf(!existsSync(data('manifest.json')))('comparación sobre los datos reales (V1.3)', () => {
  const manifest = JSON.parse(readFileSync(data('manifest.json'), 'utf-8'))
  const route = selectIllustrativeRoute(parseWaypoints(JSON.parse(readFileSync(data(manifest.waypoints.url), 'utf-8'))))!
  const info = manifest.elevation
  const bytes = readFileSync(data(info.url))
  const [originX, pixelSize, , originY] = info.geotransform
  const grid: ElevationGrid = { width: info.width, height: info.height, originX, originY, pixelSize, nodata: info.nodata, values: new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4) }
  const sampler: ElevationSampler = (x, y) => sampleBilinear(grid, x, y)
  const profilePair = (v: { lon: number; lat: number }[]) => pair(v.map(toProjected), sampler)

  it('el escenario A dentro del comparador conserva exactamente sus métricas (10 282 m, +826,3 / −50,1 m, 1030 muestras)', () => {
    const a = profilePair(route.vertices)
    expect(a.main.totalDistance).toBeCloseTo(10282.09, 1)
    expect(a.main.gain).toBeCloseTo(826.27, 1)
    expect(a.main.loss).toBeCloseTo(50.10, 1)
    expect(a.main.samples).toHaveLength(1030)
    expect(a.main.noDataPercent).toBe(0)
  })

  it('una alternativa B con desvío comparte extremos, es más larga y se describe sin valorar', () => {
    const [origin, destination] = route.vertices
    const mid = { lon: (origin.lon + destination.lon) / 2, lat: (origin.lat + destination.lat) / 2 + 0.03 }
    const bRoute = finishAlternative([...startAlternative(origin), mid], origin, destination)
    expect(sharesEndpoints(route.vertices, bRoute)).toBe(true)
    const a = profilePair(route.vertices), b = profilePair(bRoute)
    const r = cmp(a, b)
    expect(r.distance.verdict).toBe('more')
    expect(b.main.samples[0].elevation).toBe(a.main.samples[0].elevation)
    expect(b.main.samples[b.main.samples.length - 1].elevation).toBeCloseTo(a.main.samples[a.main.samples.length - 1].elevation!, 6)
    expect(r.sentence.startsWith('B recorre ')).toBe(true)
    for (const w of FORBIDDEN) expect(r.sentence.toLowerCase()).not.toContain(w)
  })
})
