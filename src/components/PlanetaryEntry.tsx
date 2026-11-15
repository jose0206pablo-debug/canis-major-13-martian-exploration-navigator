import { useEffect, useRef, useState } from 'react'
import { JEZERO_NOMINAL, SECTOR_A_EXTENT } from '../analysis/context'

/**
 * V1.4 · Entrada planetaria: MARTE → JEZERO → SECTOR A → mapa científico.
 * Marte y Jezero son VISTA DE CONTEXTO · ESQUEMA: gradientes, ruido procedural abstracto y una retícula en proyección
 * ortográfica. No contienen ni imitan imagen orbital ni datos georreferenciados. El disco de Jezero es el NOMINAL del
 * Gazetteer (aproximado, no el borde real) y el Sector A es la extensión PDS3 de D-001, igual que en el mapa.
 */
export type EntryStage = 'mars' | 'done'

export const CONTEXT_LABEL = 'Vista de contexto · esquema'
export const SCIENCE_LABEL = 'Datos científicos georreferenciados'
export const SCIENCE_DETAIL = 'CTX + DTM + posiciones + escenarios'

const c = JEZERO_NOMINAL.center
const rad = (d: number) => (d * Math.PI) / 180

// ---------- Marte (proyección ortográfica centrada al oeste de Jezero para que el cráter quede a la derecha) ----------
const G = { cx: 500, cy: 500, r: 430, lon0: 38, lat0: 12 }
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
const MERIDIANS = range(-180, 150, 30).map((lon) => visiblePath(range(-90, 90, 2).map((lat) => [lat, lon])))
const PARALLELS = [-60, -30, 30, 60].map((lat) => visiblePath(range(-180, 180, 2).map((lon) => [lat, lon])))
const EQUATOR = visiblePath(range(-180, 180, 2).map((lon) => [0, lon]))
const [JX, JY] = ortho(c.lat, c.lon)!
/** Posición de Jezero en el globo, en % del lienzo (para el botón superpuesto y el origen del acercamiento). */
const JEZERO_ON_GLOBE_PCT = { x: (JX / 1000) * 100, y: (JY / 1000) * 100 }

function MarsGlobe() {
  return <svg className="entry-globe" viewBox="0 0 1000 1000" role="img" aria-label="Marte, vista de contexto esquemática (sin imagen orbital), con la posición del cráter Jezero">
    <defs>
      <radialGradient id="entry-surface" cx="36%" cy="30%" r="78%">
        <stop offset="0%" stopColor="#ffc59a" />
        <stop offset="22%" stopColor="#f08a45" />
        <stop offset="52%" stopColor="#c1501c" />
        <stop offset="80%" stopColor="#6b1f12" />
        <stop offset="100%" stopColor="#2a0a0c" />
      </radialGradient>
      <linearGradient id="entry-terminator" x1="15%" y1="10%" x2="100%" y2="95%">
        <stop offset="48%" stopColor="#000" stopOpacity="0" />
        <stop offset="82%" stopColor="#000" stopOpacity=".55" />
        <stop offset="100%" stopColor="#000" stopOpacity=".85" />
      </linearGradient>
      <radialGradient id="entry-glow" cx="50%" cy="50%" r="50%">
        <stop offset="84%" stopColor="#ff9a5c" stopOpacity="0" />
        <stop offset="88.5%" stopColor="#ff9a5c" stopOpacity=".32" />
        <stop offset="93%" stopColor="#ff7a3c" stopOpacity=".08" />
        <stop offset="100%" stopColor="#ff7a3c" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="entry-cap" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff6ef" stopOpacity=".85" />
        <stop offset="100%" stopColor="#fff6ef" stopOpacity="0" />
      </radialGradient>
      {/* Textura ABSTRACTA (ruido procedural): da volumen; no representa el relieve ni el albedo reales. */}
      <filter id="entry-noise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="4" seed="13" />
        <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.04  0 0 0 0 0.03  0 0 0 -2.4 1.45" />
      </filter>
      <filter id="entry-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 .86  0 0 0 0 .78  0 0 0 -1.6 .9" />
      </filter>
      <clipPath id="entry-disc"><circle cx={G.cx} cy={G.cy} r={G.r} /></clipPath>
    </defs>
    <circle cx={G.cx} cy={G.cy} r={G.r * 1.14} fill="url(#entry-glow)" />
    <circle cx={G.cx} cy={G.cy} r={G.r} fill="url(#entry-surface)" />
    <g clipPath="url(#entry-disc)">
      <rect x="0" y="0" width="1000" height="1000" filter="url(#entry-noise)" opacity=".55" />
      <rect x="0" y="0" width="1000" height="1000" filter="url(#entry-grain)" opacity=".07" />
      {(() => { const cap = ortho(84, G.lon0); return cap && <ellipse cx={cap[0]} cy={cap[1] + 8} rx="120" ry="42" fill="url(#entry-cap)" /> })()}
      {MERIDIANS.map((d, i) => <path key={`m${i}`} d={d} className="entry-grid" />)}
      {PARALLELS.map((d, i) => <path key={`p${i}`} d={d} className="entry-grid" />)}
      <path d={EQUATOR} className="entry-grid strong" />
      <circle cx={G.cx} cy={G.cy} r={G.r} fill="url(#entry-terminator)" />
    </g>
    <circle cx={G.cx} cy={G.cy} r={G.r - 1} className="entry-limb" />
    <g className="entry-jezero" aria-hidden="true">
      <circle cx={JX} cy={JY} r="11" className="ring" />
      <circle cx={JX} cy={JY} r="3.2" className="dot" />
      <line x1={JX - 16} y1={JY - 16} x2={JX - 70} y2={JY - 70} className="leader" />
      <text x={JX - 76} y={JY - 78} textAnchor="end" className="label">JEZERO</text>
      <text x={JX - 76} y={JY - 56} textAnchor="end" className="sub">{c.lat.toFixed(1).replace('.', ',')}° N · {c.lon.toFixed(1).replace('.', ',')}° E</text>
    </g>
  </svg>
}

// ---------- Jezero (vista local: escala horizontal corregida por cos(latitud); 1° = 59,2747 km en la esfera de 3396,19 km) ----------
const KM_PER_DEG = 59.2747
const cosLat = Math.cos(rad(c.lat))
const S = 9 // px por km en el lienzo de 1000 × 1000
const lx = (lon: number) => 500 + (lon - c.lon) * cosLat * KM_PER_DEG * S
const ly = (lat: number) => 520 - (lat - c.lat) * KM_PER_DEG * S
const DISK_R = (JEZERO_NOMINAL.diameterKm / 2) * S
const GRID_LONS = range(77.0, 78.5, 0.25).filter((v) => Math.abs(lx(v) - 500) < 480)
const GRID_LATS = range(17.75, 19.0, 0.25).filter((v) => Math.abs(ly(v) - 500) < 480)

function JezeroView() {
  const s = SECTOR_A_EXTENT
  const sx = lx(s.west), sy = ly(s.north), sw = lx(s.east) - lx(s.west), sh = ly(s.south) - ly(s.north)
  return <svg className="entry-jezero-view" viewBox="0 0 1000 1000" role="img" aria-label="Esquema del cráter Jezero: disco nominal aproximado y Sector A con datos CTX">
    <defs>
      <radialGradient id="entry-crater" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#5a2414" stopOpacity=".55" />
        <stop offset="70%" stopColor="#2a0f0d" stopOpacity=".35" />
        <stop offset="100%" stopColor="#05070f" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="500" cy="520" r={DISK_R * 1.55} fill="url(#entry-crater)" />
    {GRID_LONS.map((v) => <g key={`lo${v}`}><line x1={lx(v)} x2={lx(v)} y1="40" y2="960" className="entry-local-grid" /><text x={lx(v) + 4} y="958" className="entry-local-tick">{v.toFixed(2).replace('.', ',')}° E</text></g>)}
    {GRID_LATS.map((v) => <g key={`la${v}`}><line x1="40" x2="960" y1={ly(v)} y2={ly(v)} className="entry-local-grid" /><text x="44" y={ly(v) - 4} className="entry-local-tick">{v.toFixed(2).replace('.', ',')}° N</text></g>)}
    <circle cx={lx(c.lon)} cy={ly(c.lat)} r={DISK_R} className="entry-disk" />
    <text x={lx(c.lon)} y={ly(c.lat) - DISK_R - 34} textAnchor="middle" className="entry-local-label">Jezero</text>
    <text x={lx(c.lon)} y={ly(c.lat) - DISK_R - 12} textAnchor="middle" className="entry-local-sub">disco nominal aprox. · no es el borde real</text>
    <rect x={sx} y={sy} width={sw} height={sh} className="entry-sector" />
    {/* Rótulos fuera del marco, a la izquierda, para que no los cruce el trazo del disco nominal. */}
    <text x={sx - 14} y={sy + 26} textAnchor="end" className="entry-sector-label">SECTOR A</text>
    <text x={sx - 14} y={sy + 50} textAnchor="end" className="entry-local-sub">datos CTX / DTM</text>
    <g transform="translate(700 900)"><line x1="0" x2={10 * S} y1="0" y2="0" className="entry-scale" /><line x1="0" x2="0" y1="-6" y2="6" className="entry-scale" /><line x1={10 * S} x2={10 * S} y1="-6" y2="6" className="entry-scale" /><text x={5 * S} y="-12" textAnchor="middle" className="entry-scale-label">10 km</text></g>
  </svg>
}

const STEPS: { id: 'mars' | 'jezero' | 'sector'; label: string }[] = [{ id: 'mars', label: 'Marte' }, { id: 'jezero', label: 'Jezero' }, { id: 'sector', label: 'Sector A' }]
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Pantalla de entrada (diálogo). V1.4.1: MARTE → ENTRAR → SECTOR A. Un solo CTA; la etapa Jezero es solo una transición
 * contextual breve (≈ 1 s en total): Marte se acerca a Jezero, el esquema Jezero → Sector A se acerca al Sector A y la
 * entrada se desvanece sobre el mapa científico, que ya está montado debajo.
 */
export function PlanetaryEntry({ onEnterSector }: { onEnterSector: () => void }) {
  const [phase, setPhase] = useState<'mars' | 'jezero' | 'sector'>('mars')
  const primary = useRef<HTMLButtonElement>(null)
  useEffect(() => { primary.current?.focus({ preventScroll: true }) }, [])
  function enter() {
    if (phase !== 'mars') return
    if (reducedMotion()) { onEnterSector(); return }
    setPhase('jezero')
    window.setTimeout(() => setPhase('sector'), 520)
    window.setTimeout(onEnterSector, 1000)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onEnterSector() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onEnterSector])
  return <div className={`entry phase-${phase}`} role="dialog" aria-modal="true" aria-labelledby="entry-title">
    <button type="button" className="entry-skip" onClick={onEnterSector}>Saltar introducción →</button>
    <div className="entry-brand">
      <h2 id="entry-title" className="entry-title">CANIS MAJOR <span className="entry-num">13</span></h2>
      <p className="entry-descriptor">Martian Exploration Navigator</p>
      <p className="entry-event">NASA Space Apps Challenge 2026</p>
    </div>
    <div className="entry-stage-area">
      <div className="entry-layer entry-layer-mars" style={{ transformOrigin: `${JEZERO_ON_GLOBE_PCT.x}% ${JEZERO_ON_GLOBE_PCT.y}%` }} aria-hidden={phase !== 'mars'}>
        <MarsGlobe />
        {/* Pulso fuera del SVG: el globo (con filtros) queda estático y no se repinta en cada fotograma. */}
        <span className="entry-pulse" style={{ left: `${JEZERO_ON_GLOBE_PCT.x}%`, top: `${JEZERO_ON_GLOBE_PCT.y}%` }} aria-hidden="true" />
        {phase === 'mars' && <button type="button" className="entry-hotspot" style={{ left: `${JEZERO_ON_GLOBE_PCT.x}%`, top: `${JEZERO_ON_GLOBE_PCT.y}%` }} onClick={enter} aria-label="Entrar al Sector A del cráter Jezero" />}
      </div>
      <div className="entry-layer entry-layer-jezero" aria-hidden="true">
        <JezeroView />
      </div>
      <p className="entry-context-label">{CONTEXT_LABEL}</p>
    </div>
    <div className="entry-actions">
      <ol className="entry-steps" aria-label="Recorrido de entrada">
        {STEPS.map((s) => <li key={s.id} className={s.id === phase ? 'current' : ''} aria-current={s.id === phase ? 'step' : undefined}>{s.label}</li>)}
      </ol>
      <p className="entry-lead">Empieza en Marte. Entra en el cráter Jezero y explora el Sector A con datos orbitales reales.</p>
      <button ref={primary} type="button" className="entry-cta" onClick={enter} disabled={phase !== 'mars'}>Entrar al Sector A</button>
    </div>
  </div>
}

/** V1.5.1 · Barra contextual compacta sobre el mapa: recorrido + resumen de datos. El detalle (CRS, «datos
 * científicos georreferenciados») vive en «Detalles del conjunto de datos», en el panel izquierdo. */
export function ContextTrail({ onPlanetary, stats }: { onPlanetary: () => void; stats?: string }) {
  return <nav className="context-trail" aria-label={SCIENCE_LABEL}>
    <ol><li>Marte</li><li>Jezero</li><li aria-current="location">Sector A</li></ol>
    {stats && <p className="context-trail-stats">{stats}</p>}
    <button type="button" className="context-trail-back" onClick={onPlanetary}>Vista planetaria</button>
  </nav>
}
