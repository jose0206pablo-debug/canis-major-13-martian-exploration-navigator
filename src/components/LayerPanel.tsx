import type { Layer } from '../data/types'
import { categoryLabel, evidenceClass, evidenceLabel } from '../utils/evidence'

type Props = { layers: Layer[]; visibleLayerIds: string[]; opacities: Record<string, number>; onToggle: (id: string) => void; onOpacityChange: (id: string, opacity: number) => void }

export function LayerPanel({ layers, visibleLayerIds, opacities, onToggle, onOpacityChange }: Props) {
  return <section><h2>Capas</h2>{layers.map((layer) => {
    const unavailable = !layer.renderable
    const opacity = opacities[layer.id] ?? layer.defaultOpacity
    return <article className="layer-item" key={layer.id}>
      <div className="layer-header">
        <input id={layer.id} type="checkbox" checked={!unavailable && visibleLayerIds.includes(layer.id)} disabled={unavailable} onChange={() => onToggle(layer.id)} />
        <label className="layer-title" htmlFor={layer.id}>
          <strong>{layer.name}</strong>
          <small>{layer.description}</small>
          <span className="layer-badges"><span className={`badge ${evidenceClass(layer.evidenceState)}`}>{unavailable ? 'No disponible' : evidenceLabel(layer.evidenceState)}</span><span className="badge category">{categoryLabel(layer.category)}</span></span>
        </label>
      </div>
      {!unavailable && (layer.type === 'tiles' || layer.type === 'image') && <label className="layer-controls">Opacidad {Math.round(opacity * 100)}%<input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(event) => onOpacityChange(layer.id, Number(event.target.value))} /></label>}
      {layer.disclaimer && <p>{layer.disclaimer}</p>}
    </article>
  })}</section>
}
