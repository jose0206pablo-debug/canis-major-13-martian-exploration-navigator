import { PROFILE_SENSITIVITY_STEP_M, type ProfileResult } from '../analysis/profile'
import { VERTICAL_REFERENCE } from '../data/layers'
import { formatDistance } from '../utils/format'
import { ProfileChart } from './ProfileChart'
import { ILLUSTRATIVE_IS_NOT } from '../data/safeguards'
import type { MetricComparison, ScenarioComparison, SharedScale } from '../analysis/compare'

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
  /** V1.3: el recorrido activo es la alternativa B (comparte origen y destino con A). */
  alternativeActive?: boolean
  onStartAlternative?: () => void
  onUndo?: () => void
  comparison?: ComparisonData | null
}

/** V1.3: datos de la comparación A/B (todos calculados con `computeProfile`, sin fórmulas nuevas). */
export interface ComparisonData {
  result: ScenarioComparison
  a: ProfileResult
  b: ProfileResult
  scale: SharedScale | null
}

export const ROUTE_NOTICE = 'Recorrido hipotético para apoyo preliminar a la interpretación científica. No es navegación certificada y no evalúa seguridad, transitabilidad ni movilidad de astronautas.'
export const ILLUSTRATIVE_TITLE = 'Escenario A · referencia ilustrativa'
/** V1.2/V1.3: contexto del escenario A. El algoritmo y el criterio (`analysis/illustrative.ts`) no cambian. */
export const ILLUSTRATIVE_HEADING = 'Del suelo de Jezero hacia la zona del borde occidental'
/** V1.3: frase permanente del comparador. */
export const COMPARE_STATEMENT = 'CANIS compara métricas topográficas; no elige ni certifica recorridos.'
export const SCENARIOS_NOT = 'Ninguna de las dos líneas representa necesariamente un recorrido real, seguro, óptimo o transitable.'
export const ILLUSTRATIVE_NOTICE = 'Comparación topográfica sobre una línea recta ilustrativa entre dos posiciones históricas.'
export const ILLUSTRATIVE_READING = 'Única lectura: el perfil muestra el cambio de relieve regional entre los dos puntos.'

const elev = (v: number | null) => (v === null ? 'sin dato' : `${v.toFixed(1)} m`)
const signed = (v: number, text: string) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${text}`
const deltaDistance = (m: MetricComparison) => (m.verdict === 'same' ? 'igual' : signed(m.delta, formatDistance(Math.abs(m.delta))))
const deltaRelief = (m: MetricComparison) => (m.verdict === 'same' ? `≤ cambio al muestrear a 10 m y ${PROFILE_SENSITIVITY_STEP_M} m` : signed(m.delta, `${Math.abs(m.delta).toFixed(1)} m`))
/** V1.3.1: con tramos sin dato, el ascenso/descenso de ese escenario suma solo los tramos con dato: se marca «parcial». */
const reliefValue = (v: number, partial: boolean) => <>{v.toFixed(1)} m{partial && <span className="partial">parcial</span>}</>
export const SAMPLING_NOTE = 'Esta comparación refleja sensibilidad al intervalo de muestreo; no representa la incertidumbre total del DTM.'
export const PARTIAL_NOTE = '«Parcial»: suma solo los tramos con dato del DTM; no es un total completo.'

/** V1.3: tabla y conclusión descriptiva de la comparación A/B, con los dos perfiles en la misma escala. */
function ComparisonView({ data }: { data: ComparisonData }) {
  const { result: r, a, b, scale } = data
  const noDataDelta = r.noData.b - r.noData.a
  const aPartial = r.noData.aDistance > 0, bPartial = r.noData.bDistance > 0
  return <section className="comparison" aria-label="Comparación de escenarios hipotéticos">
    <p className="comparison-kicker">Mismo origen · mismo destino · distinto trazado</p>
    <h3>¿Qué cambió? · Comparación de los escenarios A y B</h3>
    <p className="comparison-sentence" role="status">{r.sentence}</p>
    <table className="comparison-table">
      <thead><tr><th scope="col">Métrica</th><th scope="col">A</th><th scope="col">B</th><th scope="col">Diferencia (B − A)</th></tr></thead>
      <tbody>
        <tr><th scope="row">Distancia horizontal</th><td>{formatDistance(r.distance.a)}</td><td>{formatDistance(r.distance.b)}</td><td>{deltaDistance(r.distance)}</td></tr>
        <tr><th scope="row">Ascenso acumulado</th><td>{reliefValue(r.gain.a, aPartial)}</td><td>{reliefValue(r.gain.b, bPartial)}</td><td>{r.noDataAffects ? 'no comparable (sin dato)' : deltaRelief(r.gain)}</td></tr>
        <tr><th scope="row">Descenso acumulado</th><td>{reliefValue(r.loss.a, aPartial)}</td><td>{reliefValue(r.loss.b, bPartial)}</td><td>{r.noDataAffects ? 'no comparable (sin dato)' : deltaRelief(r.loss)}</td></tr>
        <tr><th scope="row">Sin datos del DTM</th><td>{r.noData.a.toFixed(1)} %</td><td>{r.noData.b.toFixed(1)} %</td><td>{noDataDelta === 0 ? 'igual' : signed(noDataDelta, `${Math.abs(noDataDelta).toFixed(1)} %`)}</td></tr>
      </tbody>
    </table>
    {r.noDataAffects && <p className="route-notice">Hay tramos sin datos del DTM (A: {formatDistance(r.noData.aDistance)}; B: {formatDistance(r.noData.bDistance)}). Allí no se mide el relieve, así que el ascenso y el descenso no son comparables de forma completa. {PARTIAL_NOTE}</p>}
    <p className="comparison-method">Umbral para ascenso y descenso: ±{r.gain.tolerance.toFixed(1)} m y ±{r.loss.tolerance.toFixed(1)} m, el cambio observado al muestrear a 10 m y a {PROFILE_SENSITIVITY_STEP_M} m. Una diferencia menor o igual se indica así, sin interpretarla. {SAMPLING_NOTE}</p>
    <div className="comparison-charts">
      <p className="chart-label"><span className="swatch a" /> Escenario A</p>
      <ProfileChart profile={a} scale={scale} label="Escenario A" />
      <p className="chart-label"><span className="swatch b" /> Escenario B</p>
      <ProfileChart profile={b} scale={scale} label="Escenario B" />
      {scale && <p className="comparison-method">Los dos perfiles usan la misma escala vertical y la misma longitud horizontal.</p>}
    </div>
  </section>
}

export function RoutePanel({ mode, vertexCount, profile, sensitivity, gridStatus, onStart, onFinish, onClear, illustrative, onShowIllustrative, alternativeActive = false, onStartAlternative, onUndo, comparison }: Props) {
  const drawing = mode === 'drawing'
  const alternative = alternativeActive && Boolean(onStartAlternative)
  const showingIllustrative = Boolean((illustrative?.active && mode === 'done') || alternative)
  const canCompare = Boolean(onStartAlternative && gridStatus === 'ready' && illustrative?.available)
  const comparing = alternative && mode === 'done' && Boolean(comparison)
  const offerAlternative = Boolean(onStartAlternative) && (mode === 'idle' || (mode === 'done' && (Boolean(illustrative?.active) || alternative)))
  return <section className="route-panel" aria-label="Comparar escenarios hipotéticos y perfil de elevación">
    <p className="step-kicker">3 · Comparar</p>
    <h2>Escenarios hipotéticos y perfil</h2>
    <p className="compare-statement">{COMPARE_STATEMENT}</p>
    <p className="route-lead">El escenario A es una referencia ilustrativa de CANIS; el B, una alternativa que trazas tú con el mismo origen y destino. También puedes trazar un recorrido libre.</p>
    <div className="route-actions">
      {mode === 'idle' && onShowIllustrative && <button type="button" className="route-button primary" onClick={onShowIllustrative} disabled={gridStatus !== 'ready' || !illustrative?.available}>Ver escenario A</button>}
      {offerAlternative && <button type="button" className={`route-button${mode === 'done' && illustrative?.active ? ' primary' : ''}`} onClick={onStartAlternative} disabled={!canCompare}>{alternative ? 'Volver a trazar B' : 'Trazar alternativa B'}</button>}
      {mode === 'idle' && <button type="button" className={`route-button${onShowIllustrative ? '' : ' primary'}`} onClick={onStart} disabled={gridStatus !== 'ready'}>Trazar mi recorrido</button>}
      {drawing && alternative && <button type="button" className="route-button primary" onClick={onFinish} disabled={vertexCount < 2}>Terminar en destino</button>}
      {drawing && alternative && onUndo && <button type="button" className="route-button" onClick={onUndo} disabled={vertexCount < 2}>Deshacer punto</button>}
      {drawing && !alternative && <button type="button" className="route-button primary" onClick={onFinish} disabled={vertexCount < 2}>Terminar</button>}
      {mode !== 'idle' && <button type="button" className="route-button" onClick={onClear}>Borrar</button>}
    </div>
    {alternative && <ul className="scenario-legend" aria-label="Qué representa cada línea">
      <li><span className="swatch a" /><span><strong>Escenario A</strong> · construcción ilustrativa de CANIS: línea recta entre dos posiciones históricas elegidas por una regla reproducible</span></li>
      <li><span className="swatch b" /><span><strong>Escenario B</strong> · alternativa trazada por ti, con el mismo origen y destino que A</span></li>
      <li><span className="swatch mission" /><span><strong>Posiciones de Perseverance</strong> · datos de misión (históricos)</span></li>
      <li className="scenario-not">{SCENARIOS_NOT}</li>
    </ul>}
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
    {drawing && alternative && <p className="route-hint" role="status">Alternativa B: el origen de A ya está fijado. Haz clic en el mapa para añadir puntos intermedios ({vertexCount - 1} {vertexCount - 1 === 1 ? 'punto' : 'puntos'}). Al pulsar «Terminar en destino», CANIS añade exactamente el destino de A.</p>}
    {drawing && !alternative && <p className="route-hint" role="status">Modo trazado: haz clic en el mapa para añadir vértices ({vertexCount} {vertexCount === 1 ? 'vértice' : 'vértices'}). Pulsa «Terminar» con al menos dos.</p>}

    {comparing && comparison && <ComparisonView data={comparison} />}
    {profile && profile.samples.length > 1 && !(alternative && drawing) && <>
      {!comparing && <><ProfileChart profile={profile} />
      <div className="info-section"><dl className="route-metrics">
        <dt>Longitud horizontal de la polilínea dibujada</dt><dd>{formatDistance(profile.totalDistance)}</dd>
        <dt>Elevación inicial / final</dt><dd>{elev(profile.startElevation)} / {elev(profile.endElevation)}</dd>
        <dt>Elevación mínima / máxima</dt><dd>{elev(profile.minElevation)} / {elev(profile.maxElevation)}</dd>
        <dt>Desnivel vertical acumulado (subida / bajada)</dt><dd>+{profile.gain.toFixed(1)} m / −{profile.loss.toFixed(1)} m</dd>
        <dt>Intervalo de muestreo</dt><dd>cada {profile.meanSpacing.toFixed(2)} m horizontales (máximo {profile.requestedStep} m) · {profile.samples.length} muestras</dd>
        {sensitivity && <><dt>Sensibilidad del desnivel al muestreo</dt><dd>con intervalo de {PROFILE_SENSITIVITY_STEP_M} m: +{sensitivity.gain.toFixed(1)} m / −{sensitivity.loss.toFixed(1)} m</dd></>}
        <dt>Recorrido sin información del DTM (cálculo conservador)</dt><dd>{profile.noDataPercent.toFixed(1)} % ({formatDistance(profile.noDataDistance)})</dd>
      </dl></div></>}
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
