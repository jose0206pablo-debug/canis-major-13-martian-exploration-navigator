import { useEffect, useRef } from 'react'
import { addSurfaceMarkers } from '../surface/markers'
import type { LocatedSurfaceStation } from '../surface/stations'
import L from 'leaflet'
import { MARS_CRS_BOUNDS, MARS_CRS_RESOLUTIONS, ORTHO_NATIVE_ZOOM } from '../data/mars-crs'
import { createMarsCrs } from '../data/mars-leaflet-crs'
import { dataUrl, type DataManifest, type ProjectedBounds } from '../data/manifest'
import { WAYPOINT_LAYER_ID } from '../data/layers'
import type { Layer, MapPoint, RasterLayerId, Selection } from '../data/types'
import { isInterpolated, type Waypoint } from '../data/waypoints'
import type { LonLat } from '../analysis/geodesy'


type OpacityLayer = L.Layer & { setOpacity(opacity: number): unknown }
type ProjImageOverlay = (url: string, bounds: L.Bounds, options?: L.ImageOverlayOptions) => OpacityLayer
type Props = {
  surfaceStations?: LocatedSurfaceStation[]
  onSurfaceSelect?: (station: LocatedSurfaceStation) => void
  layers: Layer[]
  pois: import('../data/types').PointOfInterest[]
  visibleLayerIds: string[]
  opacities: Record<string, number>
  manifest: DataManifest | null
  waypoints: Waypoint[] | null
  elevationAt: (x: number, y: number) => number | null | undefined
  onPointSelect: (point: Selection) => void
  onCursorChange: (point: MapPoint) => void
  /** Modo «Trazar recorrido»: los clics añaden vértices en lugar de abrir fichas. */
  drawMode: boolean
  route: LonLat[]
  onAddVertex: (vertex: LonLat) => void
  /** 'illustrative' dibuja el «Recorrido ilustrativo CANIS» con su propio estilo y rótulos de inicio y destino. */
  routeVariant?: 'user' | 'illustrative'
  routeEndLabels?: [string, string]
  /** V1.3: escenario A dibujado como referencia (estilo ilustrativo) bajo la alternativa B. Solo dibujo: no cambia zoom ni encuadre. */
  referenceRoute?: LonLat[]
  referenceEndLabels?: [string, string]
}

const crs = createMarsCrs()
const projImageOverlay = (L as unknown as { Proj: { imageOverlay: ProjImageOverlay } }).Proj.imageOverlay
const projected = (b: ProjectedBounds) => L.bounds([b.west, b.south], [b.east, b.north])
const geographic = (b: ProjectedBounds) => L.latLngBounds(crs.unproject(L.point(b.west, b.south)), crs.unproject(L.point(b.east, b.north)))

/** Dibuja una polilínea de recorrido con sus vértices (mismo estilo que la V1.1 para 'user' e 'illustrative'). */
function drawRoute(group: L.LayerGroup, route: LonLat[], variant: 'user' | 'illustrative', endLabels?: [string, string]) {
  const latlngs = route.map((v) => [v.lat, v.lon] as [number, number])
  // Línea recta en el CRS entre vértices: es exactamente el trazado que se muestrea para el perfil.
  L.polyline(latlngs, { pane: 'route', color: '#0b1512', weight: 6, opacity: 0.75, interactive: false }).addTo(group)
  const illustrative = variant === 'illustrative'
  L.polyline(latlngs, { pane: 'route', color: illustrative ? '#7fdcff' : '#ffffff', weight: illustrative ? 3 : 2.5, opacity: 1, dashArray: illustrative ? '10 6' : undefined, interactive: false }).addTo(group)
  route.forEach((v, i) => {
    const end = i === 0 || i === route.length - 1
    const marker = L.circleMarker([v.lat, v.lon], { pane: 'route', radius: end ? 5 : 3.5, color: '#0b1512', weight: 1.5, fillColor: i === 0 ? '#9be37a' : illustrative ? '#7fdcff' : '#ffffff', fillOpacity: 1, interactive: false }).addTo(group)
    if (illustrative && end && endLabels) marker.bindTooltip(endLabels[i === 0 ? 0 : 1], { permanent: true, direction: i === 0 ? 'right' : 'left', className: 'route-end-label' })
  })
}

export function MapView({ surfaceStations, onSurfaceSelect, layers, pois, visibleLayerIds, opacities, manifest, waypoints, elevationAt, onPointSelect, onCursorChange, drawMode, route, onAddVertex, routeVariant = 'user', routeEndLabels, referenceRoute, referenceEndLabels }: Props) {
  const host = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const vectorGroup = useRef<L.LayerGroup | null>(null)
  const waypointGroup = useRef<L.LayerGroup | null>(null)
  const routeGroup = useRef<L.LayerGroup | null>(null)
  const rasters = useRef<Partial<Record<RasterLayerId, OpacityLayer>>>({})
  const callbacks = useRef({ onPointSelect, onCursorChange, elevationAt, drawMode, onAddVertex })

  useEffect(() => {
    callbacks.current = { onPointSelect, onCursorChange, elevationAt, drawMode, onAddVertex }
  }, [onPointSelect, onCursorChange, elevationAt, drawMode, onAddVertex])

  // En modo trazado, un clic sobre un marcador también añade un vértice, en el punto pulsado.
  // Leaflet entrega como latlng de un clic sobre un marcador pequeño la posición del marcador, no la del ratón; con
  // waypoints solapados el vértice saltaría hasta unos 4 px. Por eso se usa siempre la posición del ratón.
  // Solo lee refs, así que es seguro usarla dentro de los efectos.
  const addVertexFrom = (event: L.LeafletMouseEvent) => {
    const latlng = mapRef.current ? mapRef.current.mouseEventToLatLng(event.originalEvent) : event.latlng
    callbacks.current.onAddVertex({ lon: latlng.lng, lat: latlng.lat })
  }

  useEffect(() => {
    if (!host.current || mapRef.current) return
    // zoomSnap 0.25: proj4leaflet interpola la escala entre niveles, así el encuadre aprovecha mejor pantallas pequeñas.
    const map = L.map(host.current, { crs, zoomControl: true, attributionControl: false, minZoom: 0, maxZoom: MARS_CRS_RESOLUTIONS.length - 1, zoomSnap: 0.25 })
    mapRef.current = map
    // Panel propio para el DTM: por encima de los tiles (200) y por debajo de los marcadores (400).
    map.createPane('dtm').style.zIndex = '350'
    // Waypoints por encima del DTM y por debajo del marcador de aterrizaje (overlayPane, 400).
    map.createPane('waypoints').style.zIndex = '390'
    // Recorrido hipotético por encima de los waypoints; sin interacción para que los clics lleguen al mapa.
    map.createPane('route').style.zIndex = '395'
    // V1.4.1: el visor ES el territorio científico (Sector A = envolvente de los productos CTX). Solo NAVEGACIÓN; no cambian
    // CRS, coordenadas ni datos. El zoom mínimo es el menor con el visor LLENO de Sector A (vista de conjunto que llena el
    // visor), y el desplazamiento no sale de él. Así el visor nunca es mayor que los límites: con márgenes, Leaflet podía
    // quedar sin responder al acercar tras un arrastre. Jezero (disco nominal) se explica en la entrada, no aquí.
    const sector = geographic(MARS_CRS_BOUNDS)
    const applyLimits = () => {
      map.setMinZoom(0)
      const fill = map.getBoundsZoom(sector, true) // menor zoom con el visor lleno de Sector A
      map.setMinZoom(Math.min(fill, MARS_CRS_RESOLUTIONS.length - 1))
    }
    const fitSector = () => {
      applyLimits()
      map.setView(sector.getCenter(), map.getMinZoom(), { animate: false })
    }
    map.setMaxBounds(sector)
    map.options.maxBoundsViscosity = 1
    fitSector()
    // El contenedor puede cambiar de tamaño tras el primer render (maquetación, aviso cerrado, giro del móvil).
    const container = host.current
    const resizeObserver = new ResizeObserver(() => { map.invalidateSize(); applyLimits() })
    resizeObserver.observe(container)
    const frame = requestAnimationFrame(() => { map.invalidateSize(); fitSector() })
    L.control.scale({ metric: true, imperial: false, maxWidth: 160 }).addTo(map)
    vectorGroup.current = L.layerGroup().addTo(map)

    const toPoint = (latlng: L.LatLng): MapPoint => {
      const p = crs.project(latlng)
      return { kind: 'map-point', coordinates: { lat: latlng.lat, lon: latlng.lng }, projected: { x: p.x, y: p.y }, elevation: callbacks.current.elevationAt(p.x, p.y), evidenceState: 'DERIVED' }
    }
    map.on('mousemove', (event) => callbacks.current.onCursorChange(toPoint(event.latlng)))
    map.on('click', (event) => {
      if (callbacks.current.drawMode) addVertexFrom(event)
      else callbacks.current.onPointSelect(toPoint(event.latlng))
    })
    routeGroup.current = L.layerGroup().addTo(map)
    return () => { cancelAnimationFrame(frame); resizeObserver.disconnect(); map.remove(); mapRef.current = null; rasters.current = {}; waypointGroup.current = null; routeGroup.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // El doble clic haría zoom mientras se añaden vértices seguidos.
    if (drawMode) map.doubleClickZoom.disable()
    else map.doubleClickZoom.enable()
    map.getContainer().classList.toggle('drawing', drawMode)
  }, [drawMode])

  useEffect(() => {
    const group = routeGroup.current
    if (!group) return
    group.clearLayers()
    // V1.3: primero el escenario A de referencia; encima, el recorrido activo (alternativa B o recorrido propio).
    if (referenceRoute && referenceRoute.length > 1) drawRoute(group, referenceRoute, 'illustrative', referenceEndLabels)
    if (route.length) drawRoute(group, route, routeVariant, referenceRoute ? undefined : routeEndLabels)
  }, [route, routeVariant, routeEndLabels, referenceRoute, referenceEndLabels])

  useEffect(() => {
    if (!mapRef.current || !manifest || rasters.current.ctx_ortho) return
    const ortho = manifest.layers.ctx_ortho
    rasters.current.ctx_ortho = L.tileLayer(dataUrl(ortho.url), {
      tileSize: ortho.tile_size ?? 256, minZoom: 0, maxZoom: MARS_CRS_RESOLUTIONS.length - 1,
      maxNativeZoom: ortho.max_native_zoom ?? ORTHO_NATIVE_ZOOM, noWrap: true, bounds: geographic(ortho.bounds_m),
    })
    const relief = manifest.layers.ctx_dtm_relief
    rasters.current.ctx_dtm_relief = projImageOverlay(dataUrl(relief.url), projected(relief.bounds_m), { pane: 'dtm', zIndex: 1, interactive: false })
    const shade = manifest.layers.ctx_dtm_hillshade
    rasters.current.ctx_dtm_hillshade = projImageOverlay(dataUrl(shade.url), projected(shade.bounds_m), { pane: 'dtm', zIndex: 2, interactive: false, className: 'hillshade-layer' })
  }, [manifest])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    for (const [id, layer] of Object.entries(rasters.current) as [RasterLayerId, OpacityLayer][]) {
      const defaults = layers.find((item) => item.id === id)
      if (visibleLayerIds.includes(id)) {
        if (!map.hasLayer(layer)) layer.addTo(map)
        layer.setOpacity(opacities[id] ?? defaults?.defaultOpacity ?? 1)
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }, [layers, visibleLayerIds, opacities, manifest])

  useEffect(() => {
    if (!mapRef.current || !waypoints?.length || waypointGroup.current) return
    const group = L.layerGroup()
    // Línea entre posiciones sucesivas (orden sol/site/drive): no es el trazado exacto del rover.
    L.polyline(waypoints.map((w) => [w.lat, w.lon] as [number, number]), { pane: 'waypoints', color: '#f0a35e', weight: 1.5, opacity: 0.85, dashArray: '4 4', interactive: false }).addTo(group)
    for (const w of waypoints) {
      const interpolated = isInterpolated(w)
      L.circleMarker([w.lat, w.lon], { pane: 'waypoints', radius: 3.5, color: '#f5b86a', weight: 1.2, fillColor: '#f5b86a', fillOpacity: interpolated ? 0.1 : 0.85, bubblingMouseEvents: false })
        .bindTooltip(`Sol ${w.sol} · RMC ${w.rmc}${interpolated ? ' · interpolada' : ''}`)
        .on('click', (event: L.LeafletMouseEvent) => {
          if (callbacks.current.drawMode) { addVertexFrom(event); return }
          const p = crs.project(L.latLng(w.lat, w.lon))
          callbacks.current.onPointSelect({ kind: 'waypoint', waypoint: w, projected: { x: p.x, y: p.y }, dtmElevation: callbacks.current.elevationAt(p.x, p.y) })
        })
        .addTo(group)
    }
    waypointGroup.current = group
  }, [waypoints])

  useEffect(() => {
    const map = mapRef.current, group = waypointGroup.current
    if (!map || !group) return
    if (visibleLayerIds.includes(WAYPOINT_LAYER_ID) && layers.find((l) => l.id === WAYPOINT_LAYER_ID)?.renderable) group.addTo(map)
    else group.remove()
  }, [layers, visibleLayerIds, waypoints])

  useEffect(() => {
    const group = vectorGroup.current
    if (!group) return
    group.clearLayers()
    if (visibleLayerIds.includes('perseverance_landing')) pois.forEach((poi) => {
      // bubblingMouseEvents: false evita que el clic llegue también al mapa y reemplace la ficha del POI.
      const marker = L.circleMarker([poi.coordinates.lat, poi.coordinates.lon], { radius: 8, color: '#72c8e8', weight: 2, fillColor: '#13374a', fillOpacity: opacities.perseverance_landing ?? 1, bubblingMouseEvents: false })
      marker.bindTooltip('Perseverance · referencia de misión').on('click', (event: L.LeafletMouseEvent) => {
        if (callbacks.current.drawMode) addVertexFrom(event)
        else callbacks.current.onPointSelect(poi)
      }).addTo(group)
    })
  }, [pois, visibleLayerIds, opacities])

  // Capa contextual independiente. No participa en límites, encuadre o cálculo; se retira mientras hay un trazado o escenario activo.
  useEffect(() => {
    const map = mapRef.current
    if (!map || drawMode || route.length > 0 || !surfaceStations?.length || !onSurfaceSelect) return
    const group = addSurfaceMarkers(map, surfaceStations, onSurfaceSelect)
    return () => { group.remove() }
  }, [surfaceStations, onSurfaceSelect, drawMode, route.length])

  return <div className="map" ref={host} role="application" aria-label="Mapa de Jezero Sector A en el CRS marciano IAU_2015:49910" />
}
