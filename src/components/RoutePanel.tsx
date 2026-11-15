import { PROFILE_SENSITIVITY_STEP_M, type ProfileResult } from '../analysis/profile'
import { VERTICAL_REFERENCE } from '../data/layers'
import { formatDistance } from '../utils/format'
import { ProfileChart } from './ProfileChart'
import { ILLUSTRATIVE_IS_NOT } from '../data/safeguards'

export type RouteMode = 'idle' | 'drawing' | 'done'
export type GridStatus = 'loading' | 'ready' | 'error'

/** Datos del «Recorrido ilustrativo CANIS» que muestra el panel (regla en `analysis/illustrative.ts`). */
export interface IllustrativeInfo {
  available: boolean
  active: boolean
  start: { rmc: string; sol: number } | null
  end: { rmc: string; sol: number; elevGeoid: number } | null
}

type Props = {
  mode: RouteMode
  vertexCount: number
  profile: ProfileResult | null
  sensitivity: ProfileResult | null
  gridStatus: GridStatus
  onStart: () => void
  onFinish: () => void
  onClear: () => void
  illustrative?: IllustrativeInfo
  onShowIllustrative?: () => void
}

export const ROUTE_NOTICE = 'Recorrido hipotético para apoyo preliminar a la interpretación científica. No es navegación certificada y no evalúa seguridad, transitabilidad ni movilidad de astronautas.'
export const ILLUSTRATIVE_TITLE = 'Recorrido ilustrativo CANIS'
/** V1.2: contexto del recorrido ilustrativo. El algoritmo y el criterio (`analysis/illustrative.ts`) no cambian. */
export const ILLUSTRATIVE_HEADING = 'Del suelo de Jezero hacia el borde occidental'
export const ILLUSTRATIVE_NOTICE = 'Comparación topográfica sobre una línea recta ilustrativa entre dos posiciones históricas.'
export const ILLUSTRATIVE_READING = 'Única lectura: el perfil muestra el cambio de relieve regional entre los dos puntos.'

const elev = (v: number | null) => (v === null ? 'sin dato' : `${v.toFixed(1)} m`)

export function RoutePanel({ mode, vertexCount, profile, sensitivity, gridStatus, onStart, onFinish, onClear, illustrative, onShowIllustrative }: Props) {
  const drawing = mode === 'drawing'
  const showingIllustrative = Boolean(illustrative?.active && mode === 'done')
  return <section className="route-panel" aria-label="Recorridos y perfil de elevación">
    <h2>Recorridos y perfil de elevación</h2>
    <p className="route-lead">Compara el relieve a lo largo de una línea: mira el recorrido ilustrativo o traza el tuyo y obtén longitud, desnivel y perfil.</p>
    <div className="route-actions">
      {mode === 'idle' && onShowIllustrative && <button type="button" className="route-button primary" onClick={onShowIllustrative} disabled={gridStatus !== 'ready' || !illustrative?.available}>Ver recorrido ilustrativo CANIS</button>}
      {mode === 'idle' && <button type="button" className={`route-button${onShowIllustrative ? '' : ' primary'}`} onClick={onStart} disabled={gridStatus !== 'ready'}>Trazar mi recorrido</button>}
      {drawing && <button type="button" className="route-button primary" onClick={onFinish} disabled={vertexCount < 2}>Terminar</button>}
      {mode !== 'idle' && <button type="button" className="route-button" onClick={onClear}>Borrar</button>}
    </div>
    {showingIllustrative && illustrative?.start && illustrative.end && <div className="illustrative-box" role="note">
      <p className="illustrative-kicker">{ILLUSTRATIVE_TITLE}</p>
      <h3>{ILLUSTRATIVE_HEADING}</h3>
      <p className="illustrative-notice">{ILLUSTRATIVE_NOTICE}</p>
      <details>
        <summary>Cómo se eligieron los extremos y qué no es</summary>
        <dl>
          <dt>Regla reproducible · inicio</dt><dd>Posición {illustrative.start.rmc} de Perseverance (sol {illustrative.start.sol}), primera localización tras el aterrizaje</dd>
          <dt>Regla reproducible · destino</dt><dd>Posición no interpolada con mayor elevación publicada en el archivo de NASA/JPL: {illustrative.end.rmc}, sol {illustrative.end.sol} ({illustrative.end.elevGeoid.toFixed(1)} m)</dd>
        </dl>
        <ul>
          {ILLUSTRATIVE_IS_NOT.map((item) => <li key={item}>{item}</li>)}
          <li className="illustrative-reading">{ILLUSTRATIVE_READING}</li>
        </ul>
      </details>
    </div>}
    <p className="route-notice">{ROUTE_NOTICE}</p>
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
