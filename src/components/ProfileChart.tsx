import { useState, type PointerEvent } from 'react'
import { noDataRanges, validRuns, type ProfileResult } from '../analysis/profile'
import { formatDistance } from '../utils/format'
import type { SharedScale } from '../analysis/compare'

const W = 320, H = 190
const M = { top: 12, right: 12, bottom: 34, left: 52 }
const PW = W - M.left - M.right, PH = H - M.top - M.bottom

function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min || 1
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? raw
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)))
  return ticks
}

/**
 * Gráfico SVG de elevación frente a distancia horizontal. Los tramos sin dato se dejan en blanco y rayados.
 * V1.3: `scale` opcional para dibujar dos perfiles con el mismo rango vertical y la misma longitud horizontal.
 */
export function ProfileChart({ profile, scale, label }: { profile: ProfileResult; scale?: SharedScale | null; label?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const { samples, totalDistance, minElevation, maxElevation } = profile
  if (minElevation === null || maxElevation === null || totalDistance <= 0) return <p className="profile-empty">Ninguna muestra del recorrido tiene datos del DTM.</p>

  const pad = Math.max(2, (maxElevation - minElevation) * 0.08)
  const y0 = scale ? scale.y0 : minElevation - pad, y1 = scale ? scale.y1 : maxElevation + pad
  const axisDistance = scale ? Math.max(scale.distance, totalDistance) : totalDistance
  const sx = (d: number) => M.left + (d / axisDistance) * PW
  const sy = (z: number) => M.top + (1 - (z - y0) / (y1 - y0)) * PH
  const useKm = axisDistance >= 2000
  const xTicks = niceTicks(0, useKm ? axisDistance / 1000 : axisDistance, 4)
  const yTicks = niceTicks(y0, y1, 4)
  const paths = validRuns(samples).map((run) => run.map((s, i) => `${i ? 'L' : 'M'}${sx(s.distance).toFixed(1)},${sy(s.elevation as number).toFixed(1)}`).join(' '))
  const gaps = noDataRanges(samples)

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const d = ((event.clientX - box.left) / box.width * W - M.left) / PW * axisDistance
    if (d < 0 || d > totalDistance) { setHover(null); return }
    let lo = 0, hi = samples.length - 1
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (samples[mid].distance < d) lo = mid; else hi = mid }
    setHover(Math.abs(samples[lo].distance - d) <= Math.abs(samples[hi].distance - d) ? lo : hi)
  }

  const h = hover === null ? null : samples[hover]
  return <figure className="profile-chart">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label ? `${label}: p` : 'P'}erfil de elevación del DTM a lo largo de ${formatDistance(totalDistance)} horizontales; elevación entre ${minElevation.toFixed(1)} y ${maxElevation.toFixed(1)} m`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <defs><pattern id="nodata-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" className="hatch-line" /></pattern></defs>
      <rect x={M.left} y={M.top} width={PW} height={PH} className="plot-bg" />
      {gaps.map(([a, b]) => <rect key={`${a}-${b}`} x={sx(a)} y={M.top} width={Math.max(1, sx(b) - sx(a))} height={PH} fill="url(#nodata-hatch)" className="nodata-band"><title>Sin dato del DTM entre {formatDistance(a)} y {formatDistance(b)}</title></rect>)}
      {yTicks.map((t) => <g key={`y${t}`}><line x1={M.left} x2={M.left + PW} y1={sy(t)} y2={sy(t)} className="grid-line" /><text x={M.left - 6} y={sy(t) + 3} textAnchor="end" className="tick">{t.toFixed(0)}</text></g>)}
      {xTicks.map((t) => { const d = useKm ? t * 1000 : t; return <g key={`x${t}`}><line x1={sx(d)} x2={sx(d)} y1={M.top + PH} y2={M.top + PH + 4} className="axis-line" /><text x={sx(d)} y={M.top + PH + 15} textAnchor="middle" className="tick">{useKm ? t : t.toFixed(0)}</text></g> })}
      {paths.map((d, i) => <path key={i} d={d} className="profile-line" />)}
      <line x1={M.left} x2={M.left + PW} y1={M.top + PH} y2={M.top + PH} className="axis-line" />
      <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + PH} className="axis-line" />
      <text x={M.left + PW / 2} y={H - 4} textAnchor="middle" className="axis-label">Distancia horizontal recorrida ({useKm ? 'km' : 'm'})</text>
      <text x={12} y={M.top + PH / 2} textAnchor="middle" transform={`rotate(-90 12 ${M.top + PH / 2})`} className="axis-label">Elevación (m)</text>
      {h && <g className="hover-mark"><line x1={sx(h.distance)} x2={sx(h.distance)} y1={M.top} y2={M.top + PH} />{h.elevation !== null && <circle cx={sx(h.distance)} cy={sy(h.elevation)} r={3} />}</g>}
    </svg>
    <figcaption>{h ? `${formatDistance(h.distance)} · ${h.elevation === null ? 'sin dato' : `${h.elevation.toFixed(1)} m`}` : 'Pasa el cursor por el gráfico para leer cada muestra. Zonas rayadas: sin dato del DTM.'}</figcaption>
  </figure>
}
