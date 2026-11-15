import { JEZERO_NOMINAL } from '../analysis/context'

/**
 * V1.5.1c · Localizador planetario compacto (panel izquierdo): UBICACIÓN → Marte → Jezero → Sector A.
 * El globo usa un render LOCAL del mosaico en color Viking MDIM 2.1 (NASA/JPL/USGS, servido por NASA Mars Trek),
 * reproyectado a ortográfica (lon0 38°E, lat0 12°N, esfera de 3 396 190 m) con GDAL en tiempo de preparación:
 * la aplicación NO hace ninguna llamada externa en ejecución. Es un localizador de contexto, no cartografía
 * científica de detalle; la posición de Jezero se dibuja con la MISMA proyección que generó la imagen.
 */
export const LOCATOR_SCHEME_LABEL = 'Localizador esquemático'
export const MARS_GLOBE_CREDIT = 'Globo del localizador: mosaico en color Viking MDIM 2.1 — NASA/JPL/USGS (vía NASA Mars Trek), render ortográfico local; sin llamadas externas.'

const c = JEZERO_NOMINAL.center
/** Centro NOMINAL de Jezero (Gazetteer USGS/IAU, Feature 14300); NO es el centro del Sector A. */
export const JEZERO_CENTER_LABEL = 'Centro nominal de Jezero'
export const JEZERO_CENTER_VALUE = `${c.lat.toFixed(1)}° N · ${c.lon.toFixed(1)}° E`
const CENTER_TOOLTIP = `${JEZERO_CENTER_LABEL} (Gazetteer USGS/IAU): no es el centro del Sector A.`

// Misma proyección ortográfica con la que se generó la imagen (gdalwarp +proj=ortho +lon_0=38 +lat_0=12).
const G = { cx: 60, cy: 60, r: 52, lon0: 38, lat0: 12 }
const rad = (d: number) => (d * Math.PI) / 180
function ortho(lat: number, lon: number): [number, number] {
  const p = rad(lat), l = rad(lon - G.lon0), p0 = rad(G.lat0)
  return [G.cx + G.r * Math.cos(p) * Math.sin(l), G.cy - G.r * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l))]
}
const [JX, JY] = ortho(c.lat, c.lon)

export function PlanetaryLocator({ onPlanetary }: { onPlanetary: () => void }) {
  return <aside className="planet-locator" aria-label={`${LOCATOR_SCHEME_LABEL}: Marte, Jezero y Sector A`}>
    <h2 className="ploc-head">Ubicación</h2>
    <div className="planet-locator-grid">
      <svg viewBox="0 0 120 120" role="img" aria-label="Marte: mosaico en color Viking MDIM 2.1 (NASA/JPL/USGS) en proyección ortográfica, con el cráter Jezero señalado">
        <title>{MARS_GLOBE_CREDIT}</title>
        <defs>
          <clipPath id="ploc-clip"><circle cx={G.cx} cy={G.cy} r={G.r} /></clipPath>
          <radialGradient id="ploc-glow" cx="50%" cy="50%" r="50%">
            <stop offset="86%" stopColor="#ff9a5c" stopOpacity="0" /><stop offset="94%" stopColor="#ff9a5c" stopOpacity=".22" /><stop offset="100%" stopColor="#ff9a5c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ploc-shade" x1="12%" y1="8%" x2="100%" y2="96%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".42" />
          </linearGradient>
        </defs>
        <circle cx={G.cx} cy={G.cy} r={G.r + 6} fill="url(#ploc-glow)" />
        <g clipPath="url(#ploc-clip)">
          <image href={`${import.meta.env.BASE_URL}locator/mars_mdim21_ortho.webp`} x={G.cx - G.r} y={G.cy - G.r} width={G.r * 2} height={G.r * 2} />
          <circle cx={G.cx} cy={G.cy} r={G.r} fill="url(#ploc-shade)" />
        </g>
        <circle cx={G.cx} cy={G.cy} r={G.r} className="ploc-limb" />
        <circle cx={JX} cy={JY} r="5" className="ploc-jezero-ring" />
        <circle cx={JX} cy={JY} r="1.7" className="ploc-jezero-dot" />
      </svg>
      <div className="planet-locator-text">
        <p className="ploc-place">Jezero</p>
        <p className="ploc-coords" title={CENTER_TOOLTIP}><abbr title={CENTER_TOOLTIP}>{JEZERO_CENTER_VALUE}</abbr></p>
        <p className="ploc-sector">Sector A</p>
        <button type="button" className="ploc-open" onClick={onPlanetary} title={LOCATOR_SCHEME_LABEL}>Vista planetaria <span aria-hidden="true">↗</span></button>
      </div>
    </div>
  </aside>
}
