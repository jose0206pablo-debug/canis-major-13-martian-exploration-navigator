import { describe, expect, it } from 'vitest'
import { catalog, RASTER_LAYER_IDS } from '../src/data/layers'

describe('catálogo de capas', () => {
  it('asigna una fuente existente a cada capa', () => {
    const sourceIds = new Set(catalog.sources.map((source) => source.id))
    expect(catalog.layers.every((layer) => sourceIds.has(layer.sourceId))).toBe(true)
  })

  it('declara las tres capas ráster CTX con su producto de origen', () => {
    const byId = Object.fromEntries(catalog.layers.map((layer) => [layer.id, layer]))
    expect(RASTER_LAYER_IDS.every((id) => byId[id])).toBe(true)
    expect(byId.ctx_ortho.sourceId).toBe('ctx_trn_ortho_6m')
    expect(byId.ctx_dtm_relief.sourceId).toBe('ctx_trn_dtm_20m')
    expect(byId.ctx_dtm_hillshade.category).toBe('derived')
  })

  it('declara los waypoints como capa contextual que advierte que no son rutas humanas', () => {
    const waypoints = catalog.layers.find((layer) => layer.id === 'perseverance_waypoints')
    expect(waypoints?.category).toBe('contextual')
    expect(waypoints?.disclaimer).toMatch(/no son rutas humanas/)
    expect(catalog.layers.filter((layer) => layer.type === 'candidate').every((layer) => layer.evidenceState !== 'INTEGRATED')).toBe(true)
  })

  it('etiqueta los POI con estado de evidencia', () => {
    expect(catalog.pois.every((poi) => Boolean(poi.evidenceState))).toBe(true)
  })
})
