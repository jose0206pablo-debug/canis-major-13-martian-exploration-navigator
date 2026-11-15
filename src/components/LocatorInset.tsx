import { useState } from 'react'
import { JEZERO_NOMINAL, SECTOR_A_EXTENT } from '../analysis/context'

/**
 * Localizador ESQUEMÁTICO (V1.1): Marte → Jezero → Sector A. Solo líneas y rótulos; no contiene ni imita imagen orbital.
 * Posiciones calculadas a partir del centro y diámetro del Gazetteer (disco nominal) y de la extensión PDS3 de D-001.
 */
const MARS_W = 132, MARS_H = 66
const marsX = (lon: number) => (lon / 360) * MARS_W
const marsY = (lat: number) => ((90 - lat) / 180) * MARS_H

// Vista local de Jezero: escala horizontal corregida por cos(latitud) para que el disco sea circular.
const LOCAL = 60 // px por grado de latitud
const c = JEZERO_NOMINAL.center
const cosLat = Math.cos((c.lat * Math.PI) / 180)
const radiusDeg = (JEZERO_NOMINAL.diameterKm / 2) / 59.2747 // 1° = 59,2747 km en la esfera de 3396,19 km
const lx = (lon: number) => 66 + (lon - c.lon) * cosLat * LOCAL
const ly = (lat: number) => 44 - (lat - c.lat) * LOCAL

/** variant 'panel': fijo en el panel izquierdo (pantallas anchas). variant 'map': flotante y plegable sobre el mapa (móvil). */
export function LocatorInset({ variant = 'panel' }: { variant?: 'panel' | 'map' }) {
  const floating = variant === 'map'
  const [open, setOpen] = useState(!floating)
  const s = SECTOR_A_EXTENT
  return <aside className={`locator locator-${variant} ${open ? 'open' : 'closed'}`} aria-label="Localizador esquemático: Marte, Jezero y Sector A">
    {floating ? <button type="button" className="locator-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Ocultar situación' : '¿Dónde estamos?'}</button> : <h2 className="locator-heading">¿Dónde estamos?</h2>}
    {open && <>
      <svg viewBox="0 0 132 160" role="img" aria-label="Esquema: Marte con la posición de Jezero; disco nominal de Jezero con el Sector A cubierto por datos CTX">
        <text x="0" y="8" className="loc-title">1 · Marte (esquema)</text>
        <g transform="translate(0,12)">
          <rect x="0" y="0" width={MARS_W} height={MARS_H} className="loc-frame" />
          {[90, 180, 270].map((lon) => <line key={lon} x1={marsX(lon)} x2={marsX(lon)} y1="0" y2={MARS_H} className="loc-grid" />)}
          <line x1="0" x2={MARS_W} y1={marsY(0)} y2={marsY(0)} className="loc-grid" />
          <circle cx={marsX(c.lon)} cy={marsY(c.lat)} r="2.6" className="loc-jezero-dot" />
          <text x={marsX(c.lon) + 5} y={marsY(c.lat) + 3} className="loc-label">Jezero</text>
        </g>
        <text x="0" y="92" className="loc-title">2 · Jezero → 3 · Sector A</text>
        <g transform="translate(0,96)">
          <circle cx={lx(c.lon)} cy={ly(c.lat)} r={radiusDeg * LOCAL} className="loc-disk" />
          <rect x={lx(s.west)} y={ly(s.north)} width={(s.east - s.west) * cosLat * LOCAL} height={(s.north - s.south) * LOCAL} className="loc-sector" />
          <text x={lx(s.west) + 2} y={ly(s.north) + 8} className="loc-label">Sector A</text>
        </g>
      </svg>
      <ul className="loc-legend">
        <li><span className="key disk" /> Jezero: <strong>disco nominal</strong> de {JEZERO_NOMINAL.diameterKm.toLocaleString('es')} km (Gazetteer USGS/IAU), aproximado; <strong>no es el borde real</strong></li>
        <li><span className="key sector" /> Sector A: cobertura CTX de alta resolución (imagen 6 m, relieve 20 m)</li>
        <li>Esquema de situación, sin imagen orbital.</li>
      </ul>
    </>}
  </aside>
}
