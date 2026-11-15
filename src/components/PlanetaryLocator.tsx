import { JEZERO_NOMINAL } from '../analysis/context'

/**
 * V1.5.1 · Localizador planetario COMPACTO (panel izquierdo): MARTE → JEZERO → SECTOR A en pocos segundos,
 * sin pantalla previa. Mini-Marte esquemático en SVG (gradientes y retícula, misma proyección ortográfica y
 * encuadre que la vista planetaria grande): NO es cartografía científica ni imagen orbital. La vista planetaria
 * completa (PlanetaryEntry) queda como opción secundaria mediante «Vista planetaria».
 */
export const LOCATOR_SCHEME_LABEL = 'Localizador esquemático'

const c = JEZERO_NOMINAL.center
/** Coordenadas del CENTRO NOMINAL de Jezero (Gazetteer); no confundir con el centro del Sector A. */
export const JEZERO_CENTER_LABEL = 'Centro nominal de Jezero'
export const JEZERO_CENTER_VALUE = `${c.lat.toFixed(1).replace('.', ',')}° N · ${c.lon.toFixed(1).replace('.', ',')}° E`

// Proyección ortográfica, mismos parámetros de encuadre que la vista planetaria grande (lon0 38, lat0 12).
const G = { cx: 60, cy: 60, r: 52, lon0: 38, lat0: 12 }
const rad = (d: number) => (d * Math.PI) / 180
function ortho(lat: number, lon: number): [number, number] | null {
  const p = rad(lat), l = rad(lon - G.lon0), p0 = rad(G.lat0)
  if (Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l) <= 0) return null
  return [G.cx + G.r * Math.cos(p) * Math.sin(l), G.cy - G.r * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l))]
}
function visiblePath(points: [number, number][]) {
  let d = '', pen = false
  for (const [lat, lon] of points) {
    const q = ortho(lat, lon)
    if (!q) { pen = false; continue }
    d += `${pen ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`
    pen = true
  }
  return d
}
const range = (a: number, b: number, step: number) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step)
const MERIDIANS = range(-180, 135, 45).map((lon) => visiblePath(range(-90, 90, 4).map((lat) => [lat, lon])))
const PARALLELS = [-45, 0, 45].map((lat) => visiblePath(range(-180, 180, 4).map((lon) => [lat, lon])))
const [JX, JY] = ortho(c.lat, c.lon)!

export function PlanetaryLocator({ onPlanetary }: { onPlanetary: () => void }) {
  return <aside className="planet-locator" aria-label={`${LOCATOR_SCHEME_LABEL}: Marte, Jezero y Sector A`}>
    <svg viewBox="0 0 120 120" role="img" aria-label="Mini esquema de Marte con la posición del cráter Jezero; no es imagen orbital">
      <defs>
        <radialGradient id="ploc-surface" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#f0a56b" /><stop offset="45%" stopColor="#c1501c" /><stop offset="80%" stopColor="#6b1f12" /><stop offset="100%" stopColor="#36100e" />
        </radialGradient>
        <linearGradient id="ploc-shade" x1="15%" y1="10%" x2="100%" y2="95%">
          <stop offset="50%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".6" />
        </linearGradient>
      </defs>
      <circle cx={G.cx} cy={G.cy} r={G.r} fill="url(#ploc-surface)" />
      {MERIDIANS.map((d, i) => <path key={`m${i}`} d={d} className="ploc-grid" />)}
      {PARALLELS.map((d, i) => <path key={`p${i}`} d={d} className="ploc-grid" />)}
      <circle cx={G.cx} cy={G.cy} r={G.r} fill="url(#ploc-shade)" />
      <circle cx={G.cx} cy={G.cy} r={G.r} className="ploc-limb" />
      <circle cx={JX} cy={JY} r="4.5" className="ploc-jezero-ring" />
      <circle cx={JX} cy={JY} r="1.6" className="ploc-jezero-dot" />
    </svg>
    <div className="planet-locator-text">
      <ol className="ploc-trail" aria-label="Del planeta al área de estudio">
        <li>Marte</li><li>Jezero</li><li aria-current="location">Sector A</li>
      </ol>
      <p className="ploc-coords">{JEZERO_CENTER_LABEL}: <strong>{JEZERO_CENTER_VALUE}</strong></p>
      <p className="ploc-scheme">{LOCATOR_SCHEME_LABEL}</p>
      <button type="button" className="ploc-open" onClick={onPlanetary}>Vista planetaria</button>
    </div>
  </aside>
}
