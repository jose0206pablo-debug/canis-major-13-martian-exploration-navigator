import L from 'leaflet'
import type { LocatedSurfaceStation } from './stations'

/** Capa contextual independiente: no toca rasters, CRS, perfiles ni datos de misión. */
export function addSurfaceMarkers(map: L.Map, stations: readonly LocatedSurfaceStation[], onSelect: (station: LocatedSurfaceStation) => void): L.LayerGroup {
  const group = L.layerGroup().addTo(map)
  const icon = L.divIcon({ className: 'surface-marker', iconSize: [24, 24], iconAnchor: [12, 12], html: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/></svg>' })
  for (const station of stations) {
    L.marker([station.waypoint.lat, station.waypoint.lon], { icon, keyboard: true, title: `Vista de superficie · RMC ${station.rmc} · imagen sol ${station.imageSol}`, alt: `Estación de superficie ${station.rmc}`, bubblingMouseEvents: false })
      .bindTooltip(`Vista de superficie · imagen sol ${station.imageSol} · RMC ${station.rmc}`)
      .on('click', () => onSelect(station)).addTo(group)
  }
  return group
}
