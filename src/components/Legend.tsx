import type { DataManifest } from '../data/manifest'
import type { Layer } from '../data/types'

function ElevationRamp({ manifest }: { manifest: DataManifest }) {
  const stops = manifest.layers.ctx_dtm_relief.palette ?? []
  if (stops.length < 2) return null
  const min = stops[0].value, max = stops[stops.length - 1].value
  const gradient = stops.map((s) => `${s.color} ${(((s.value - min) / (max - min)) * 100).toFixed(1)}%`).join(', ')
  return <div className="legend-ramp">
    <span>Elevación CTX DTM (m)</span>
    <div className="legend-ramp-bar" style={{ background: `linear-gradient(to right, ${gradient})` }} />
    <div className="legend-ramp-labels"><span>{min.toFixed(1)}</span><span>{max.toFixed(1)}</span></div>
    <small>Respecto a un areoide compatible con MOLA (GMM3). Escala lineal entre el mínimo y el máximo exactos del DTM.</small>
  </div>
}

export function Legend({ layers, manifest }: { layers: Layer[]; manifest: DataManifest | null }) {
  const legends = layers.filter((layer) => layer.legend !== 'none')
  return <section><h3>Leyenda</h3>{legends.length === 0 ? <p className="legend-muted">No hay capas visibles.</p> : legends.map((layer) => {
    if (layer.legend === 'elevation') return manifest ? <ElevationRamp key={layer.id} manifest={manifest} /> : null
    if (layer.legend === 'ortho') return <div className="legend-row" key={layer.id}><span className="legend-symbol gray" /><span>Ortomosaico CTX: brillo relativo, sin unidades físicas</span></div>
    if (layer.legend === 'hillshade') return <div className="legend-row" key={layer.id}><span className="legend-symbol gray" /><span>Sombreado sintético (luz 315°, 45°): solo visual</span></div>
    if (layer.legend === 'waypoints') return <div className="legend-block" key={layer.id}>
      <div className="legend-row"><span className="legend-symbol waypoint" /><span>Posición histórica de Perseverance (medida)</span></div>
      <div className="legend-row"><span className="legend-symbol waypoint hollow" /><span>Posición interpolada (no medida)</span></div>
      <div className="legend-row"><span className="legend-symbol traverse" /><span>Orden de las posiciones: no es una ruta humana</span></div>
    </div>
    return <div className="legend-row" key={layer.id}><span className="legend-symbol marker" /><span>Referencia de misión</span></div>
  })}</section>
}
