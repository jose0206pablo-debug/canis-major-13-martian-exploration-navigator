import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { computeProfile } from '../src/analysis/profile'
import { RoutePanel, ROUTE_NOTICE } from '../src/components/RoutePanel'

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
    expect(render({ mode: 'idle', profile: null, sensitivity: null, vertexCount: 0 })).toContain('Trazar recorrido')
    const drawing = render({ mode: 'drawing', vertexCount: 1, profile: null, sensitivity: null })
    expect(drawing).toContain('Terminar')
    expect(drawing).toMatch(/<button[^>]*disabled[^>]*>Terminar/)
    expect(drawing).toContain('Borrar')
  })
})
