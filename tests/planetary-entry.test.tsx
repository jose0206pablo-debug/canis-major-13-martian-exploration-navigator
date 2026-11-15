import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CONTEXT_LABEL, ContextTrail, PlanetaryEntry, SCIENCE_DETAIL, SCIENCE_LABEL } from '../src/components/PlanetaryEntry'

const noop = () => undefined
const render = (stage: 'mars' | 'jezero') => renderToStaticMarkup(<PlanetaryEntry stage={stage} onStage={noop} onEnterSector={noop} />)

describe('entrada planetaria (V1.4)', () => {
  it('etapa Marte: identidad dominante, globo rotulado como vista de contexto · esquema y CTA reales', () => {
    const html = render('mars')
    expect(html).toContain('role="dialog"')
    expect(html).toMatch(/CANIS MAJOR <span class="entry-num">13<\/span>/)
    expect(html).toContain('Martian Exploration Navigator')
    expect(html).toContain('NASA Space Apps Challenge 2026')
    expect(html).toContain(CONTEXT_LABEL)
    expect(CONTEXT_LABEL).toBe('Vista de contexto · esquema')
    expect(html).toContain('sin imagen orbital')
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Explorar Jezero<\/button>/)
    expect(html).toMatch(/<button[^>]*>Saltar introducción/)
    expect(html).toContain('aria-label="Explorar el cráter Jezero"') // el marcador también es un botón
    expect(html).not.toMatch(/<image\b|<img\b/) // sin imagen rasterizada
  })

  it('etapa Jezero: disco nominal aproximado (no el borde real), Sector A y «Entrar al Sector A»', () => {
    const html = render('jezero')
    expect(html).toContain('stage-jezero')
    expect(html).toContain('disco nominal aprox. · no es el borde real')
    expect(html).toContain('SECTOR A')
    expect(html).toContain('datos CTX / DTM')
    expect(html).toMatch(/<button[^>]*>Entrar al Sector A<\/button>/)
    expect(html).toContain('← Marte')
    expect(html).toContain(CONTEXT_LABEL)
  })

  it('Jezero está en la cara visible del globo', () => {
    // Posición del botón-marcador sobre el globo (en % del lienzo de 1000 × 1000; radio del globo = 43 %).
    const m = render('mars').match(/class="entry-hotspot" style="left:([\d.]+)%;top:([\d.]+)%"/)
    expect(m).not.toBeNull()
    const x = Number(m![1]), y = Number(m![2])
    expect(Math.hypot(x - 50, y - 50)).toBeLessThan(43)
    expect(x).toBeGreaterThan(50) // a la derecha del centro
  })

  it('dentro del mapa, el contexto compacto distingue la ciencia georreferenciada y permite volver a la vista planetaria', () => {
    const html = renderToStaticMarkup(<ContextTrail onPlanetary={noop} />)
    for (const step of ['Marte', 'Jezero', 'Sector A']) expect(html).toContain(step)
    expect(html).toContain(SCIENCE_LABEL)
    expect(SCIENCE_LABEL).toBe('Datos científicos georreferenciados')
    expect(html).toContain(SCIENCE_DETAIL)
    expect(html).toMatch(/<button[^>]*>Vista planetaria<\/button>/)
  })
})
