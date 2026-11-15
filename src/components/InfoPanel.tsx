import { catalog, VERTICAL_REFERENCE } from '../data/layers'
import type { EvidenceState, MapPoint, Selection, WaypointSelection } from '../data/types'
import { isInterpolated, localizationLabel } from '../data/waypoints'
import { evidenceClass, evidenceLabel } from '../utils/evidence'
import { formatElevation } from '../utils/format'

type Props = { point: Selection | null; onClear: () => void }

function WaypointCard({ selection, onClear }: { selection: WaypointSelection; onClear: () => void }) {
  const w = selection.waypoint
  const dtm = selection.dtmElevation
  const source = catalog.sources.find((item) => item.id === 'perseverance_waypoints')
  return <section className="info-card">
    <div className="info-title"><div><h2>Sol {w.sol} · RMC {w.rmc}</h2><span className="badge category">Posición histórica del rover</span></div><button className="clear-button" type="button" onClick={onClear} aria-label="Cerrar ficha">×</button></div>
    <p className="info-warning">Ubicación histórica de Perseverance. No es una ruta humana segura ni una evaluación de transitabilidad.</p>
    <div className="info-section"><dl>
      <dt>Coordenadas (MMGIS, planetocéntricas)</dt><dd>{w.lat.toFixed(6)}° N, {w.lon.toFixed(6)}° E</dd>
      <dt>Tipo de localización</dt><dd>{localizationLabel(w.note)}{isInterpolated(w) ? ' — no es una medida' : ''}</dd>
      <dt>Site / drive</dt><dd>{w.site} / {w.drive}</dd>
      <dt>Distancia acumulada del rover</dt><dd>{w.distTotalM > 0 ? `${(w.distTotalM / 1000).toFixed(2)} km` : 'No publicada para este tipo de localización (el archivo indica 0)'}</dd>
    </dl></div>
    <div className="info-section"><dl>
      <dt>Altura publicada (elev_geoid, MMGIS)</dt><dd>{w.elevGeoid.toFixed(2)} m</dd>
      <dt>Elevación del DTM D-001 en este punto</dt><dd>{formatElevation(dtm)}</dd>
      {typeof dtm === 'number' && <><dt>Diferencia DTM − MMGIS</dt><dd>{(dtm - w.elevGeoid).toFixed(1)} m</dd></>}
    </dl></div>
    {source && <div className="info-section"><h3>Fuente y limitaciones</h3><ul className="limit-list">
      <li>{source.organism} · {source.productId}. <a href={source.url} target="_blank" rel="noreferrer">GeoJSON oficial</a></li>
      {source.limitations.map((item) => <li key={item}>{item}</li>)}
    </ul></div>}
  </section>
}

function Header({ title, state, onClear }: { title: string; state: EvidenceState; onClear: () => void }) {
  return <div className="info-title"><div><h2>{title}</h2><span className={`badge ${evidenceClass(state)}`}>{evidenceLabel(state)}</span></div><button className="clear-button" type="button" onClick={onClear} aria-label="Cerrar ficha">×</button></div>
}

function MapPointCard({ point, onClear }: { point: MapPoint; onClear: () => void }) {
  return <section className="info-card"><Header title="Punto consultado" state={point.evidenceState} onClear={onClear} />
    <div className="info-section"><dl>
      <dt>Coordenadas planetocéntricas (calculadas)</dt><dd>{point.coordinates.lat.toFixed(5)}° N, {point.coordinates.lon.toFixed(5)}° E</dd>
      <dt>Coordenadas proyectadas IAU_2015:49910</dt><dd>x {point.projected.x.toFixed(1)} m · y {point.projected.y.toFixed(1)} m</dd>
      <dt>Elevación (derivada del DTM D-001)</dt><dd>{formatElevation(point.elevation)}</dd>
    </dl></div>
    <div className="info-section"><h3>Cómo se obtiene</h3><ul className="limit-list">
      <li>Coordenadas: transformación del CRS marciano (esfera de 3 396 190 m), no medidas en el terreno.</li>
      <li>Elevación: interpolación bilineal entre los 4 píxeles de 20 m más cercanos del DTM CTX.</li>
      <li>{VERTICAL_REFERENCE}</li>
    </ul></div>
    <div className="info-section"><h3>Limitaciones</h3><ul className="limit-list">
      <li>Un píxel de 20 m no representa rocas ni obstáculos menores.</li>
      <li>Posible desfase de contenido DTM–ortomosaico de 30–40 m, no demostrado.</li>
      <li>No es una evaluación de seguridad ni de transitabilidad.</li>
    </ul></div>
  </section>
}

export function InfoPanel({ point, onClear }: Props) {
  if (!point) return <section><h2>Información del punto</h2><p className="info-empty">Haz clic en el mapa para consultar coordenadas y elevación, o selecciona una posición histórica de Perseverance. Cada ficha indica el origen del dato y sus limitaciones.</p></section>
  if ('kind' in point) return point.kind === 'waypoint' ? <WaypointCard selection={point} onClear={onClear} /> : <MapPointCard point={point} onClear={onClear} />

  const source = catalog.sources.find((item) => item.id === point.sourceId)
  return <section className="info-card"><Header title={point.name} state={point.evidenceState} onClear={onClear} />
    <div className="info-section"><dl><dt>Coordenadas</dt><dd>{point.coordinates.lat.toFixed(4)}° N, {point.coordinates.lon.toFixed(4)}° E</dd><dt>Categoría</dt><dd>{point.category === 'mission' ? 'Contexto de misión' : point.category}</dd><dt>Descripción</dt><dd>{point.description}</dd></dl></div>
    {source && <div className="info-section"><dl><dt>Fuente</dt><dd>{source.name} · {source.organism}</dd>{source.productId && <><dt>Producto</dt><dd>{source.productId}</dd></>}{source.url && <dd><a href={source.url} target="_blank" rel="noreferrer">Consultar fuente oficial</a></dd>}</dl></div>}
    <div className="info-section"><h3>Limitaciones</h3><ul className="limit-list">{point.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
  </section>
}
