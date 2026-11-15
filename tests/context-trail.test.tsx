import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ContextTrail, SCIENCE_DETAIL, SCIENCE_LABEL } from '../src/components/ContextTrail'
import { JEZERO_CENTER_LABEL, JEZERO_CENTER_VALUE, LOCATOR_SCHEME_LABEL, MARS_GLOBE_CREDIT, PlanetaryLocator } from '../src/components/PlanetaryLocator'

describe('contexto y localizador (V1.5.1 final)', () => {
  it('la barra contextual resume MARTE / JEZERO / SECTOR A y los datos, sin vista planetaria separada', () => {
    const html = renderToStaticMarkup(<ContextTrail stats="CTX 6 m · DTM 20 m · 708 posiciones" />)
    for (const step of ['Marte', 'Jezero', 'Sector A']) expect(html).toContain(step)
    expect(html).toContain('CTX 6 m · DTM 20 m · 708 posiciones')
    expect(html).toContain(SCIENCE_LABEL) // etiqueta accesible de la barra
    expect(SCIENCE_LABEL).toBe('Datos científicos georreferenciados')
    expect(SCIENCE_DETAIL).toBe('CTX + DTM + posiciones + escenarios') // se muestra en «Detalles del conjunto de datos»
    expect(html).not.toContain('Vista planetaria')
  })

  it('el localizador compacto conserva Marte MDIM 2.1 local, Jezero, el centro nominal, Sector A y la atribución', () => {
    const html = renderToStaticMarkup(<PlanetaryLocator />)
    expect(html).toContain('Ubicación')
    expect(html).toContain('Jezero')
    expect(html).toContain('Sector A')
    expect(html).toContain(JEZERO_CENTER_VALUE)
    expect(JEZERO_CENTER_VALUE).toBe('18.4° N · 77.7° E')
    expect(html).toContain(JEZERO_CENTER_LABEL) // tooltip: centro nominal del Gazetteer, no el centro del Sector A
    expect(html).toMatch(/<image\b[^>]*locator\/mars_mdim21_ortho\.webp/) // asset local; sin llamadas externas en ejecución
    expect(MARS_GLOBE_CREDIT).toContain('MDIM 2.1')
    expect(MARS_GLOBE_CREDIT).toContain('NASA/JPL/USGS')
    expect(html).toContain('MDIM 2.1') // crédito dentro del propio SVG (<title>)
    expect(html).toContain(LOCATOR_SCHEME_LABEL)
    expect(LOCATOR_SCHEME_LABEL).toBe('Localizador esquemático')
    expect(html).not.toContain('Vista planetaria') // V1.5.1 final: la vista separada se eliminó
  })
})
