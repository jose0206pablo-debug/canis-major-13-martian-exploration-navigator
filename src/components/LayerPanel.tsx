import type { Layer } from '../data/types'
import { categoryLabel, evidenceClass, evidenceLabel } from '../utils/evidence'

type Props = { layers: Layer[]; visibleLayerIds: string[]; opacities: Record<string, number>; onToggle: (id: string) => void; onOpacityChange: (id: string, opacity: number) => void }

/**
 * V1.5.1 · Presentación inicial breve (progressive disclosure): casilla + nombre corto + resolución + opacidad.
 * La información científica existente NO se elimina: nombre completo, descripción, insignias de evidencia y
 * advertencias quedan en el desplegable «Detalles» de cada capa (siempre en el DOM).
 */
const COMPACT: Record<string, { title: string; tag?: string }> = {
  ctx_ortho: { title: 'CTX · Imagen orbital', tag: '6 m/píxel' },
  ctx_dtm_relief: { title: 'DTM · Elevación', tag: '20 m/píxel' },
  ctx_dtm_hillshade: { title: 'Relieve sombreado', tag: 'derivado del DTM' },
  perseverance_waypoints: { title: 'Posiciones de Perseverance', tag: '708 · soles 13–2022' },
  perseverance_landing: { title: 'Referencia de aterrizaje', tag: 'misión' },
}

export function LayerPanel({ layers, visibleLayerIds, opacities, onToggle, onOpacityChange }: Props) {
  return <section><h2>Capas</h2>{layers.map((layer) => {
    const unavailable = !layer.renderable
    const opacity = opacities[layer.id] ?? layer.defaultOpacity
    const compact = COMPACT[layer.id] ?? { title: layer.name }
    return <article className="layer-item" key={layer.id}>
      <div className="layer-header">
        <input id={layer.id} type="checkbox" checked={!unavailable && visibleLayerIds.includes(layer.id)} disabled={unavailable} onChange={() => onToggle(layer.id)} />
        <label className="layer-title" htmlFor={layer.id}>
          <strong>{compact.title}</strong>
          {compact.tag && <span className="layer-tag">{unavailable ? 'No disponible' : compact.tag}</span>}
        </label>
      </div>
      {!unavailable && (layer.type === 'tiles' || layer.type === 'image') && <label className="layer-controls">Opacidad {Math.round(opacity * 100)}%<input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(event) => onOpacityChange(layer.id, Number(event.target.value))} /></label>}
      <details className="layer-details">
        <summary>Detalles</summary>
        <p className="layer-fullname">{layer.name}</p>
        <small>{layer.description}</small>
        <span className="layer-badges"><span className={`badge ${evidenceClass(layer.evidenceState)}`}>{unavailable ? 'No disponible' : evidenceLabel(layer.evidenceState)}</span><span className="badge category">{categoryLabel(layer.category)}</span></span>
        {layer.disclaimer && <p>{layer.disclaimer}</p>}
      </details>
    </article>
  })}</section>
}
