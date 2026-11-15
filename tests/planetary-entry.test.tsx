import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CONTEXT_LABEL, ContextTrail, PlanetaryEntry, SCIENCE_DETAIL, SCIENCE_LABEL } from '../src/components/PlanetaryEntry'
import { JEZERO_CENTER_LABEL, JEZERO_CENTER_VALUE, LOCATOR_SCHEME_LABEL, PlanetaryLocator } from '../src/components/PlanetaryLocator'

const noop = () => undefined
// V1.4.1: un solo CTA; la etapa Jezero es solo una transición breve (sus elementos están en el DOM desde el inicio).
const render = () => renderToStaticMarkup(<PlanetaryEntry onEnterSector={noop} />)

describe('entrada planetaria (V1.4 / V1.4.1)', () => {
  it('Marte: identidad dominante, globo rotulado como vista de contexto · esquema y CTA reales', () => {
    const html = render()
    expect(html).toContain('role="dialog"')
    expect(html).toMatch(/CANIS MAJOR <span class="entry-num">13<\/span>/)
    expect(html).toContain('Martian Exploration Navigator')
    expect(html).toContain('NASA Space Apps Challenge 2026')
    expect(html).toContain(CONTEXT_LABEL)
    expect(CONTEXT_LABEL).toBe('Vista de contexto · esquema')
    expect(html).toContain('sin imagen orbital')
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Entrar al Sector A<\/button>/)
    expect(html).not.toContain('Explorar Jezero') // V1.4.1: sin pantalla intermedia con su propio CTA
    expect(html).toMatch(/<button[^>]*>Saltar introducción/)
    expect(html).toContain('aria-label="Entrar al Sector A del cráter Jezero"') // el marcador también es un botón
    expect(html).not.toMatch(/<image\b|<img\b/) // sin imagen rasterizada
  })

  it('transición Jezero → Sector A: disco nominal aproximado (no el borde real) y Sector A, sin pantalla propia', () => {
    const html = render()
    expect(html).toContain('entry-layer-jezero')
    for (const step of ['Marte', 'Jezero', 'Sector A']) expect(html).toContain(`>${step}</li>`)
    expect(html).toContain('disco nominal aprox. · no es el borde real')
    expect(html).toContain('SECTOR A')
    expect(html).toContain('datos CTX / DTM')
    expect(html).not.toContain('← Marte')
    expect(html).toContain(CONTEXT_LABEL)
  })

  it('Jezero está en la cara visible del globo', () => {
    // Posición del botón-marcador sobre el globo (en % del lienzo de 1000 × 1000; radio del globo = 43 %).
    const m = render().match(/class="entry-hotspot" style="left:([\d.]+)%;top:([\d.]+)%"/)
    expect(m).not.toBeNull()
    const x = Number(m![1]), y = Number(m![2])
    expect(Math.hypot(x - 50, y - 50)).toBeLessThan(43)
    expect(x).toBeGreaterThan(50) // a la derecha del centro
  })

  it('V1.5.1: la barra contextual compacta resume recorrido y datos, y permite abrir la vista planetaria', () => {
    const html = renderToStaticMarkup(<ContextTrail onPlanetary={noop} stats="CTX 6 m · DTM 20 m · 708 posiciones" />)
    for (const step of ['Marte', 'Jezero', 'Sector A']) expect(html).toContain(step)
    expect(html).toContain('CTX 6 m · DTM 20 m · 708 posiciones')
    expect(html).toContain(SCIENCE_LABEL) // como etiqueta accesible de la barra
    expect(SCIENCE_LABEL).toBe('Datos científicos georreferenciados')
    expect(SCIENCE_DETAIL).toBe('CTX + DTM + posiciones + escenarios') // se muestra en «Detalles del conjunto de datos»
    expect(html).toMatch(/<button[^>]*>Vista planetaria<\/button>/)
  })

  it('V1.5.1c: el localizador muestra Marte real (MDIM 2.1 local), Jezero, el centro nominal y Sector A', () => {
    const html = renderToStaticMarkup(<PlanetaryLocator onPlanetary={noop} />)
    expect(html).toContain('Ubicación')
    expect(html).toContain('Jezero')
    expect(html).toContain('Sector A')
    expect(html).toContain(JEZERO_CENTER_VALUE)
    expect(JEZERO_CENTER_VALUE).toBe('18.4° N · 77.7° E')
    expect(html).toContain(JEZERO_CENTER_LABEL) // tooltip: centro nominal del Gazetteer, no el centro del Sector A
    expect(html).toMatch(/<image\b[^>]*locator\/mars_mdim21_ortho\.webp/) // asset local; sin llamadas externas en ejecución
    expect(html).toContain('MDIM 2.1') // crédito NASA/JPL/USGS presente
    expect(html).toContain(LOCATOR_SCHEME_LABEL)
    expect(html).toMatch(/<button[^>]*>Vista planetaria/)
  })
})
