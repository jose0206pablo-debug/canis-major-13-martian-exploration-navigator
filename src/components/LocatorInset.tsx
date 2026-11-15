import { useState } from 'react'
import { JEZERO_NOMINAL, SECTOR_A_EXTENT } from '../analysis/context'

/**
 * Localizador ESQUEMÁTICO (V1.2): Marte → Jezero → Sector A → CTX/DTM.
 * El globo es un «falso 3D» hecho solo con gradientes y una retícula en proyección ortográfica: NO contiene ni imita
 * imagen orbital. Posiciones calculadas a partir del centro y diámetro del Gazetteer (disco nominal) y de la extensión
 * PDS3 de D-001.
 */
const c = JEZERO_NOMINAL.center

// --- 1 · Globo (proyección ortográfica centrada al oeste de Jezero para que el cráter quede a la derecha) ---
const G = { cx: 60, cy: 60, r: 50, lon0: 45, lat0: 15 }
const rad = (d: number) => (d * Math.PI) / 180
function ortho(lat: number, lon: number): [number, number] | null {
  const p = rad(lat), l = rad(lon - G.lon0), p0 = rad(G.lat0)
  if (Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l) <= 0) return null // cara oculta
  return [G.cx + G.r * Math.cos(p) * Math.sin(l), G.cy - G.r * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l))]
}
/** Polilínea visible (partida en tramos donde cruza al hemisferio oculto) como atributo `d` de SVG. */
function visiblePath(points: [number, number][]) {
  let d = '', pen = false
  for (const [lat, lon] of points) {
    const q = ortho(lat, lon)
    if (!q) { pen = false; continue }
    d += `${pen ? 'L' : 'M'}${q[0].toFixed(2)} ${q[1].toFixed(2)}`
    pen = true
  }
  return d
}
const range = (a: number, b: number, step: number) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step)
const MERIDIANS = range(-180, 150, 30).map((lon) => visiblePath(range(-90, 90, 3).map((lat) => [lat, lon])))
const PARALLELS = [-60, -30, 30, 60].map((lat) => visiblePath(range(-180, 180, 3).map((lon) => [lat, lon])))
const EQUATOR = visiblePath(range(-180, 180, 3).map((lon) => [0, lon]))
const JEZERO_ON_GLOBE = ortho(c.lat, c.lon)!

// --- 2 · Jezero → 3 · Sector A (vista local; escala horizontal corregida por cos(latitud) para que el disco sea circular) ---
const LOCAL = 60 // px por grado de latitud
const cosLat = Math.cos(rad(c.lat))
const radiusDeg = (JEZERO_NOMINAL.diameterKm / 2) / 59.2747 // 1° = 59,2747 km en la esfera de 3396,19 km
const lx = (lon: number) => 66 + (lon - c.lon) * cosLat * LOCAL
const ly = (lat: number) => 44 - (lat - c.lat) * LOCAL

function Globe({ id }: { id: string }) {
  const [jx, jy] = JEZERO_ON_GLOBE
  return <svg viewBox="0 0 120 120" role="img" aria-label="Esquema de Marte, sin imagen orbital, con la posición del cráter Jezero">
    <defs>
      <radialGradient id={`${id}-surface`} cx="38%" cy="32%" r="75%">
        <stop offset="0%" stopColor="#ffb786" />
        <stop offset="28%" stopColor="#e7742f" />
        <stop offset="62%" stopColor="#9a3416" />
        <stop offset="100%" stopColor="#3f1117" />
      </radialGradient>
      <linearGradient id={`${id}-shade`} x1="20%" y1="15%" x2="95%" y2="90%">
        <stop offset="55%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity=".55" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="86%" stopColor="#ffb786" stopOpacity="0" />
        <stop offset="93%" stopColor="#ffb786" stopOpacity=".28" />
        <stop offset="100%" stopColor="#ffb786" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx={G.cx} cy={G.cy} r={G.r + 7} fill={`url(#${id}-glow)`} />
    <circle cx={G.cx} cy={G.cy} r={G.r} fill={`url(#${id}-surface)`} />
    {MERIDIANS.map((d, i) => <path key={`m${i}`} d={d} className="globe-grid" />)}
    {PARALLELS.map((d, i) => <path key={`p${i}`} d={d} className="globe-grid" />)}
    <path d={EQUATOR} className="globe-equator" />
    <circle cx={G.cx} cy={G.cy} r={G.r} fill={`url(#${id}-shade)`} />
    <circle cx={jx} cy={jy} r="3.2" className="globe-jezero-pulse" />
    <circle cx={jx} cy={jy} r="3.2" className="globe-jezero-ring" />
    <circle cx={jx} cy={jy} r="1" className="globe-jezero-dot" />
    <text x={jx - 6} y={jy - 8} textAnchor="end" className="globe-label">Jezero</text>
  </svg>
}

function LocalView() {
  const s = SECTOR_A_EXTENT
  return <svg viewBox="26 8 76 70" role="img" aria-label="Esquema: disco nominal de Jezero con el Sector A cubierto por datos CTX">
    <circle cx={lx(c.lon)} cy={ly(c.lat)} r={radiusDeg * LOCAL} className="loc-disk" />
    <rect x={lx(s.west)} y={ly(s.north)} width={(s.east - s.west) * cosLat * LOCAL} height={(s.north - s.south) * LOCAL} className="loc-sector" />
    <text x={lx(s.west) + 3} y={ly(s.north) + 9} className="loc-label">Sector A</text>
    <text x={lx(c.lon) + 12} y={ly(c.lat) - radiusDeg * LOCAL + 2} className="loc-label">Jezero</text>
  </svg>
}

/**
 * variant 'panel': fijo en el panel izquierdo (pantallas anchas). variant 'map': flotante y plegable sobre el mapa (móvil).
 * onExplore: solo dirige la atención al mapa existente (no cambia el zoom ni el encuadre de Leaflet).
 */
export function LocatorInset({ variant = 'panel', onExplore }: { variant?: 'panel' | 'map'; onExplore?: () => void }) {
  const floating = variant === 'map'
  const [open, setOpen] = useState(!floating)
  return <aside className={`locator locator-${variant} ${open ? 'open' : 'closed'}`} aria-label="Localizador esquemático: Marte, Jezero y Sector A">
    {floating ? <button type="button" className="locator-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Ocultar situación' : '¿Dónde estamos?'}</button> : <h2 className="locator-heading">¿Dónde estamos?</h2>}
    {open && <>
      <ol className="loc-trail" aria-label="Del contexto al dato">
        <li>Marte</li><li>Jezero</li><li>Sector A</li><li>CTX/DTM</li>
      </ol>
      <div className="loc-figures">
        <figure className="loc-figure">
          <Globe id={`mars-${variant}`} />
          <figcaption><strong><span className="loc-step-n">1</span>Marte · vista de contexto</strong>Esquema de ubicación · no es imagen orbital</figcaption>
        </figure>
        <figure className="loc-figure">
          <LocalView />
          <figcaption><strong><span className="loc-step-n">2</span>Jezero <span className="loc-step-n">3</span>Sector A</strong>Disco nominal y zona con datos CTX</figcaption>
        </figure>
      </div>
      <ul className="loc-legend">
        <li><span className="key disk" /> Jezero: <strong>disco nominal</strong> de {JEZERO_NOMINAL.diameterKm.toLocaleString('es')} km (Gazetteer USGS/IAU), aproximado; <strong>no es el borde real</strong></li>
        <li><span className="key sector" /> Sector A: cobertura CTX de alta resolución</li>
        <li>Esquema de situación, sin imagen orbital.</li>
      </ul>
      <div className="loc-data">
        <p><span className="loc-step-n">4</span><strong>CTX/DTM</strong> · imagen de 6 m y relieve de 20 m en el mapa</p>
        {onExplore && <button type="button" className="explore-button" onClick={() => { onExplore(); if (floating) setOpen(false) }}>Explorar Sector A</button>}
      </div>
    </>}
  </aside>
}
