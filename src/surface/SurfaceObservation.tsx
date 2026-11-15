import { useEffect, useRef, useState } from 'react'
import { associationText, localSurfaceImage, nasaImage, nasaPage, type LocatedSurfaceStation } from './stations'
import './surface.css'

/** Solo se monta una observación a la vez; el archivo local no provoca solicitudes externas. */
export function SurfaceObservation({ station, onClose }: { station: LocatedSurfaceStation; onClose: () => void }) {
  const [failed, setFailed] = useState(false)
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    panel.current?.focus({ preventScroll: true })
    if (window.matchMedia('(max-width: 1050px)').matches) panel.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  return <section ref={panel} tabIndex={-1} className="surface-observation" aria-label={`Vista de superficie ${station.rmc}`}>
    <button type="button" className="surface-close" onClick={onClose}>Cerrar observación</button>
    <h2>Vista de superficie</h2>
    <p><strong>Perseverance · RMC {station.rmc}</strong><br />Imagen: sol {station.imageSol} · Posición CANIS: sol {station.waypointSol}</p>
    <figure>
      {failed ? <p role="alert">No se pudo cargar la imagen local. Consulta la fuente NASA.</p> : <img src={localSurfaceImage(station)} alt={station.alt} width={station.width} height={station.height} onError={() => setFailed(true)} />}
      <figcaption>{station.camera}<br />Crédito: {station.credit}</figcaption>
    </figure>
    <p>{station.description}</p>
    <p className="surface-association">{associationText(station)} La orientación no está determinada sobre CTX.</p>
    <p>Vista histórica local: no evalúa seguridad ni transitabilidad y no permite identificar sobre CTX cada roca visible.</p>
    <a href={nasaPage(station)} target="_blank" rel="noopener noreferrer">Ver fuente NASA ↗</a>
    <details><summary>Metadatos y asociación</summary><dl>
      <dt>Fecha terrestre publicada</dt><dd>{station.date}</dd>
      <dt>Hora solar media local (LMST)</dt><dd>{station.lmst}</dd>
      <dt>Resolución de imagen</dt><dd>{station.width} × {station.height} píxeles (no es resolución del terreno)</dd>
      <dt>Identificador publicado</dt><dd>{station.productId}</dd>
      <dt>Coordenadas del waypoint CANIS</dt><dd>{station.waypoint.lat.toFixed(8)}° N, {station.waypoint.lon.toFixed(8)}° E</dd>
    </dl><p>El marcador identifica la posición histórica asociada; no demuestra una huella ni orientación de la cámara sobre el mapa.</p>
    <a href={nasaImage(station)} target="_blank" rel="noopener noreferrer">Imagen oficial PNG ↗</a></details>
  </section>
}

export function SurfaceStationList({ stations, onSelect, disabled = false }: { stations: LocatedSurfaceStation[]; onSelect: (station: LocatedSurfaceStation) => void; disabled?: boolean }) {
  return <details className="surface-list"><summary>Observaciones de superficie ({stations.length})</summary>
    <p>La cámara identifica una posición histórica asociada, no el área fotografiada.</p>
    <ul>{stations.map((station) => <li key={station.rmc}><button type="button" disabled={disabled} onClick={() => onSelect(station)}>Ver superficie · RMC {station.rmc} · imagen sol {station.imageSol}</button></li>)}</ul>
  </details>
}
