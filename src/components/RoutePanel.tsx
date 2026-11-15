import { PROFILE_SENSITIVITY_STEP_M, type ProfileResult } from '../analysis/profile'
import { VERTICAL_REFERENCE } from '../data/layers'
import { formatDistance } from '../utils/format'
import { ProfileChart } from './ProfileChart'

export type RouteMode = 'idle' | 'drawing' | 'done'
export type GridStatus = 'loading' | 'ready' | 'error'

type Props = {
  mode: RouteMode
  vertexCount: number
  profile: ProfileResult | null
  sensitivity: ProfileResult | null
  gridStatus: GridStatus
  onStart: () => void
  onFinish: () => void
  onClear: () => void
}

export const ROUTE_NOTICE = 'Recorrido hipotético para apoyo preliminar a la interpretación científica. No es navegación certificada y no evalúa seguridad, transitabilidad ni movilidad de astronautas.'

const elev = (v: number | null) => (v === null ? 'sin dato' : `${v.toFixed(1)} m`)

export function RoutePanel({ mode, vertexCount, profile, sensitivity, gridStatus, onStart, onFinish, onClear }: Props) {
  const drawing = mode === 'drawing'
  return <section className="route-panel" aria-label="Perfil de un recorrido hipotético">
    <h2>Perfil de un recorrido hipotético</h2>
    <p className="route-notice">{ROUTE_NOTICE}</p>
    <div className="route-actions">
      {mode === 'idle' && <button type="button" className="route-button primary" onClick={onStart} disabled={gridStatus !== 'ready'}>Trazar recorrido</button>}
      {drawing && <button type="button" className="route-button primary" onClick={onFinish} disabled={vertexCount < 2}>Terminar</button>}
      {mode !== 'idle' && <button type="button" className="route-button" onClick={onClear}>Borrar</button>}
    </div>
    {gridStatus === 'loading' && <p className="route-hint">Cargando el DTM…</p>}
    {gridStatus === 'error' && <p className="route-hint">El DTM no está disponible: no se puede calcular el perfil.</p>}
    {drawing && <p className="route-hint" role="status">Modo trazado: haz clic en el mapa para añadir vértices ({vertexCount} {vertexCount === 1 ? 'vértice' : 'vértices'}). Pulsa «Terminar» con al menos dos.</p>}

    {profile && profile.samples.length > 1 && <>
      <ProfileChart profile={profile} />
      <div className="info-section"><dl className="route-metrics">
        <dt>Longitud horizontal de la polilínea dibujada</dt><dd>{formatDistance(profile.totalDistance)}</dd>
        <dt>Elevación inicial / final</dt><dd>{elev(profile.startElevation)} / {elev(profile.endElevation)}</dd>
        <dt>Elevación mínima / máxima</dt><dd>{elev(profile.minElevation)} / {elev(profile.maxElevation)}</dd>
        <dt>Desnivel vertical acumulado (subida / bajada)</dt><dd>+{profile.gain.toFixed(1)} m / −{profile.loss.toFixed(1)} m</dd>
        <dt>Intervalo de muestreo</dt><dd>cada {profile.meanSpacing.toFixed(2)} m horizontales (máximo {profile.requestedStep} m) · {profile.samples.length} muestras</dd>
        {sensitivity && <><dt>Sensibilidad del desnivel al muestreo</dt><dd>con intervalo de {PROFILE_SENSITIVITY_STEP_M} m: +{sensitivity.gain.toFixed(1)} m / −{sensitivity.loss.toFixed(1)} m</dd></>}
        <dt>Recorrido sin información del DTM (cálculo conservador)</dt><dd>{profile.noDataPercent.toFixed(1)} % ({formatDistance(profile.noDataDistance)})</dd>
      </dl></div>
      <div className="info-section"><h3>Cómo se calcula</h3><ul className="limit-list">
        <li>Cada tramo se divide en partes iguales de como máximo {profile.requestedStep} m horizontales; en cada muestra se lee el DTM CTX D-001 por interpolación bilineal. Sin filtros ni suavizado.</li>
        <li>La longitud horizontal se calcula sumando los segmentos de la polilínea dibujada sobre la esfera marciana de 3 396 190 m; no es un arco único entre el inicio y el final, y no incluye la inclinación del terreno. El desnivel es la componente vertical.</li>
        <li>El desnivel acumulado suma las diferencias entre muestras consecutivas con dato. El ruido del DTM y el intervalo elegido lo aumentan o lo reducen; por eso se muestra también con {PROFILE_SENSITIVITY_STEP_M} m.</li>
        <li>El porcentaje sin información es conservador: cada intervalo de muestreo con algún extremo sin dato cuenta entero, incluido el que cruza el límite del DTM, por lo que el porcentaje puede superar la proporción geométricamente exterior. Esos tramos no se rellenan ni se incluyen en el desnivel.</li>
      </ul></div>
      <div className="info-section"><h3>Limitaciones</h3><ul className="limit-list">
        <li>No es una medición exacta del relieve real: con 20 m por píxel no se resuelven rocas, escalones ni pendientes locales.</li>
        <li>Posible desfase de contenido DTM–ortomosaico de 30–40 m, no demostrado: un trazado dibujado sobre la imagen puede leer el DTM algo desplazado.</li>
        <li>{VERTICAL_REFERENCE} Los desniveles son diferencias de altura y no dependen de esa referencia.</li>
      </ul></div>
    </>}
  </section>
}
