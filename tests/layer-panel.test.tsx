import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LayerPanel } from '../src/components/LayerPanel'
import { catalog } from '../src/data/layers'

const render = (layers = catalog.layers) => renderToStaticMarkup(<LayerPanel layers={layers} visibleLayerIds={['ctx_ortho']} opacities={{ ctx_ortho: 1 }} onToggle={() => undefined} onOpacityChange={() => undefined} />)

describe('panel de capas', () => {
  it('muestra las capas CTX y la capa contextual de waypoints con su advertencia', () => {
    const markup = render()
    expect(markup).toContain('Ortomosaico CTX 6 m')
    expect(markup).toContain('Elevación CTX DTM 20 m')
    expect(markup).toContain('Dato medido')
    expect(markup).toContain('Derivado')
    expect(markup).toContain('Posiciones históricas de Perseverance')
    expect(markup).toContain('Contextual')
    expect(markup).toContain('no son rutas humanas seguras')
  })

  it('desactiva las capas ráster cuando faltan los derivados', () => {
    const markup = render(catalog.layers.map((layer) => layer.id === 'ctx_ortho' ? { ...layer, renderable: false } : layer))
    expect(markup).toMatch(/id="ctx_ortho"[^>]*disabled/)
  })
})
