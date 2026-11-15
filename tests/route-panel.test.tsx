import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { computeProfile } from '../src/analysis/profile'
import { ILLUSTRATIVE_IS_NOT } from '../src/data/safeguards'
import { ILLUSTRATIVE_HEADING, ILLUSTRATIVE_NOTICE, ILLUSTRATIVE_READING, ILLUSTRATIVE_TITLE, RoutePanel, ROUTE_NOTICE } from '../src/components/RoutePanel'

const noop = () => undefined
// Recorrido de 1 km en el ecuador; la segunda mitad queda sin dato.
const profile = computeProfile([{ x: 0, y: 0 }, { x: 1000, y: 0 }], (x) => (x > 500 ? null : 0.1 * x))
const sensitivity = computeProfile([{ x: 0, y: 0 }, { x: 1000, y: 0 }], (x) => (x > 500 ? null : 0.1 * x), 40)
const render = (props: Partial<Parameters<typeof RoutePanel>[0]> = {}) => renderToStaticMarkup(
  <RoutePanel mode="done" vertexCount={2} profile={profile} sensitivity={sensitivity} gridStatus="ready" onStart={noop} onFinish={noop} onClear={noop} {...props} />,
)

describe('panel del perfil de recorrido', () => {
  it('muestra el aviso fijo y separa distancia horizontal y desnivel vertical', () => {
    const html = render()
    expect(html).toContain(ROUTE_NOTICE)
    expect(html).toContain('Longitud horizontal de la polilínea dibujada')
    expect(html).toContain('sumando los segmentos de la polilínea dibujada')
    expect(html).toContain('Desnivel vertical acumulado')
    expect(html).toContain('+50.0 m / −0.0 m')
    expect(html).toContain('Intervalo de muestreo')
    expect(html).toContain('máximo 10 m')
    expect(html).toContain('con intervalo de 40 m')
  })

  it('informa del porcentaje sin información y del método sin suavizado', () => {
    const html = render()
    expect(html).toContain('Recorrido sin información del DTM (cálculo conservador)')
    expect(html).toContain('cada intervalo de muestreo con algún extremo sin dato cuenta entero')
    expect(html).toContain('50.0 %')
    expect(html).toContain('Sin filtros ni suavizado')
    expect(html).toContain('nodata-band')
  })

  it('advierte de la resolución de 20 m y del posible desfase de 30–40 m', () => {
    const html = render()
    expect(html).toContain('No es una medición exacta del relieve real')
    expect(html).toContain('20 m por píxel')
    expect(html).toContain('30–40 m, no demostrado')
  })

  it('no presenta el recorrido como seguro, transitable o apto para astronautas', () => {
    const text = render().replace(/<[^>]+>/g, ' ').toLowerCase()
    for (const forbidden of ['ruta segura', 'recorrido seguro', 'es transitable', 'zona transitable', 'apto para', 'ruta recomendada', 'ruta óptima']) expect(text).not.toContain(forbidden)
    expect(text).toContain('no es navegación certificada')
  })

  it('muestra los controles según el modo', () => {
    // V1.1: el botón se llama «Trazar mi recorrido» y convive con el recorrido ilustrativo.
    expect(render({ mode: 'idle', profile: null, sensitivity: null, vertexCount: 0 })).toContain('Trazar mi recorrido')
    const drawing = render({ mode: 'drawing', vertexCount: 1, profile: null, sensitivity: null })
    expect(drawing).toContain('Terminar')
    expect(drawing).toMatch(/<button[^>]*disabled[^>]*>Terminar/)
    expect(drawing).toContain('Borrar')
  })
})

describe('recorrido ilustrativo CANIS (V1.1)', () => {
  const info = { available: true, active: true, start: { rmc: '3_0', sol: 13 }, end: { rmc: '64_0', sol: 1354, elevGeoid: -1785.999 } }
  const withIllustrative = (props: Partial<Parameters<typeof RoutePanel>[0]> = {}) => render({ illustrative: info, onShowIllustrative: noop, ...props })

  it('ofrece «Ver recorrido ilustrativo CANIS» junto a «Trazar mi recorrido»', () => {
    const html = withIllustrative({ mode: 'idle', profile: null, sensitivity: null, vertexCount: 0 })
    expect(html).toContain('Ver recorrido ilustrativo CANIS')
    expect(html).toContain('Trazar mi recorrido')
  })

  it('explica la regla de selección y que no es una ruta segura, óptima ni transitable', () => {
    const html = withIllustrative()
    expect(html).toContain(ILLUSTRATIVE_TITLE)
    expect(html).toContain(ILLUSTRATIVE_NOTICE)
    expect(html).toContain('Posición 3_0 de Perseverance (sol 13)')
    expect(html).toContain('Posición no interpolada con mayor elevación publicada')
    expect(html).toContain('64_0, sol 1354 (-1786.0 m)')
    // Fuera de la negación explícita del aviso, ningún texto presenta el recorrido como propuesta, segura u óptima.
    const text = html.replace(/<[^>]+>/g, ' ').replace(ILLUSTRATIVE_NOTICE, ' ').toLowerCase()
    for (const forbidden of ['ruta propuesta', 'ruta recomendada', 'ruta segura', 'ruta óptima', 'es transitable']) expect(text).not.toContain(forbidden)
  })

  it('V1.2: contextualiza el recorrido sin atribuir interés científico a la elección de los puntos', () => {
    const html = withIllustrative()
    expect(ILLUSTRATIVE_HEADING).toBe('Del suelo de Jezero hacia el borde occidental')
    expect(ILLUSTRATIVE_NOTICE).toBe('Comparación topográfica sobre una línea recta ilustrativa entre dos posiciones históricas.')
    expect(html).toContain(ILLUSTRATIVE_HEADING)
    expect(html).toContain('Regla reproducible')
    for (const item of ILLUSTRATIVE_IS_NOT) expect(html).toContain(item)
    const text = html.replace(/<[^>]+>/g, ' ').toLowerCase()
    for (const idea of ['trayecto real', 'no es seguro', 'no es óptimo', 'no certifica la transitabilidad']) expect(text).toContain(idea)
    expect(html).toContain(ILLUSTRATIVE_READING)
    for (const forbidden of ['interés científico', 'interes cientifico', 'por su interés', 'elegidos por canis']) expect(text).not.toContain(forbidden)
  })

  it('no muestra el bloque ilustrativo cuando el recorrido es del usuario', () => {
    expect(withIllustrative({ illustrative: { ...info, active: false } })).not.toContain(ILLUSTRATIVE_NOTICE)
  })
})
