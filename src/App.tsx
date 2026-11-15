import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { Attribution } from './components/Attribution'
import { CoordinateBar } from './components/CoordinateBar'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { InfoPanel } from './components/InfoPanel'
import { LayerPanel } from './components/LayerPanel'
import { Legend } from './components/Legend'
import { MapView } from './components/MapView'
import { RoutePanel, type GridStatus, type RouteMode } from './components/RoutePanel'
import { toProjected, type LonLat } from './analysis/geodesy'
import { computeProfile, PROFILE_SENSITIVITY_STEP_M, PROFILE_STEP_M } from './analysis/profile'
import { loadElevationGrid, sampleBilinear, type ElevationGrid } from './data/elevation'
import { catalog, RASTER_LAYER_IDS, WAYPOINT_LAYER_ID } from './data/layers'
import { loadManifest, type DataManifest } from './data/manifest'
import type { Layer, MapPoint, Selection } from './data/types'
import { loadWaypoints, type Waypoint } from './data/waypoints'

type DataStatus = 'loading' | 'ready' | 'missing'
const MISSING_DATA = 'No se encontraron los datos del mapa. Verifica que public/data/ esté incluido antes de compilar y que dist/data/ se publique junto con index.html (ver README.md).'
const isRaster = (layer: Layer) => (RASTER_LAYER_IDS as string[]).includes(layer.id)

function App() {
  const [manifest, setManifest] = useState<DataManifest | null>(null)
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading')
  const [grid, setGrid] = useState<ElevationGrid | null>(null)
  const [gridError, setGridError] = useState<string | null>(null)
  const [waypoints, setWaypoints] = useState<Waypoint[] | null>(null)
  const [visibleLayerIds, setVisibleLayerIds] = useState<string[]>(() => catalog.layers.filter((layer) => layer.visibleDefault).map((layer) => layer.id))
  const [opacities, setOpacities] = useState<Record<string, number>>(() => Object.fromEntries(catalog.layers.map((layer) => [layer.id, layer.defaultOpacity])))
  const [selectedPoint, setSelectedPoint] = useState<Selection | null>(null)
  const [cursor, setCursor] = useState<MapPoint | null>(null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(true)
  const [routeMode, setRouteMode] = useState<RouteMode>('idle')
  const [route, setRoute] = useState<LonLat[]>([])

  useEffect(() => {
    let cancelled = false
    loadManifest().then((loaded) => {
      if (cancelled) return
      setManifest(loaded)
      setDataStatus(loaded ? 'ready' : 'missing')
      if (loaded) loadElevationGrid(loaded.elevation).then((g) => { if (!cancelled) setGrid(g) }).catch((error: unknown) => { if (!cancelled) setGridError(String(error)) })
      if (loaded?.waypoints) loadWaypoints(loaded.waypoints.url).then((w) => { if (!cancelled) setWaypoints(w) }).catch(() => { if (!cancelled) setWaypoints([]) })
    })
    return () => { cancelled = true }
  }, [])

  const layers = useMemo(() => catalog.layers.map((layer) => {
    if (isRaster(layer)) return { ...layer, renderable: dataStatus === 'ready', disclaimer: dataStatus === 'missing' ? MISSING_DATA : layer.disclaimer }
    if (layer.id === WAYPOINT_LAYER_ID) {
      const ready = Boolean(waypoints && waypoints.length > 0)
      return { ...layer, renderable: ready, disclaimer: ready ? layer.disclaimer : dataStatus === 'loading' ? 'Cargando posiciones del rover…' : 'Waypoints no disponibles: genera los derivados con D-005 descargado.' }
    }
    return layer
  }), [dataStatus, waypoints])
  const activeLayers = useMemo(() => layers.filter((layer) => layer.renderable && visibleLayerIds.includes(layer.id)), [layers, visibleLayerIds])
  const elevationAt = useCallback((x: number, y: number) => (grid ? sampleBilinear(grid, x, y) : undefined), [grid])
  const gridStatus: GridStatus = grid ? 'ready' : gridError || dataStatus === 'missing' ? 'error' : 'loading'
  const addVertex = useCallback((vertex: LonLat) => setRoute((current) => [...current, vertex]), [])
  // Perfil con el intervalo principal (≤ 10 m) y, solo para mostrar la sensibilidad del desnivel, con 40 m.
  const profiles = useMemo(() => {
    if (!grid || route.length < 2) return { main: null, sensitivity: null }
    const vertices = route.map(toProjected)
    const sampler = (x: number, y: number) => sampleBilinear(grid, x, y)
    return { main: computeProfile(vertices, sampler, PROFILE_STEP_M), sensitivity: computeProfile(vertices, sampler, PROFILE_SENSITIVITY_STEP_M) }
  }, [grid, route])

  function toggleLayer(layerId: string) {
    setVisibleLayerIds((current) => current.includes(layerId) ? current.filter((id) => id !== layerId) : [...current, layerId])
  }

  const status = dataStatus === 'ready' ? 'CTX D-004 (6 m) y D-001 (20 m)' : dataStatus === 'loading' ? 'Cargando datos CTX…' : 'Derivados CTX no generados'

  return <main className="app-shell">
    <header className="topbar">
      <div><p className="eyebrow">NASA Space Apps Challenge 2026 · Explorador educativo</p><h1>CANIS MAJOR 13 <span>· Jezero Sector A</span></h1></div>
      <div className="status-summary" aria-label="Estado de los datos"><strong>Mapa 2D · IAU_2015:49910</strong><span>{status}</span></div>
    </header>
    {disclaimerOpen && <DisclaimerBanner onDismiss={() => setDisclaimerOpen(false)} />}
    <section className="explorer-layout" aria-label="Explorador cartográfico de Jezero">
      <aside className="left-panel panel"><LayerPanel layers={layers} visibleLayerIds={visibleLayerIds} opacities={opacities} onToggle={toggleLayer} onOpacityChange={(id, opacity) => setOpacities((current) => ({ ...current, [id]: opacity }))} /><Legend layers={activeLayers} manifest={manifest} /></aside>
      <section className="map-column"><MapView layers={layers} pois={catalog.pois} visibleLayerIds={visibleLayerIds} opacities={opacities} manifest={manifest} waypoints={waypoints} elevationAt={elevationAt} onPointSelect={setSelectedPoint} onCursorChange={setCursor} drawMode={routeMode === 'drawing'} route={route} onAddVertex={addVertex} /><CoordinateBar cursor={cursor} elevationError={gridError} /><Attribution activeLayers={activeLayers} /></section>
      <aside className="right-panel panel">
        <RoutePanel mode={routeMode} vertexCount={route.length} profile={profiles.main} sensitivity={profiles.sensitivity} gridStatus={gridStatus}
          onStart={() => { setRoute([]); setRouteMode('drawing') }} onFinish={() => setRouteMode('done')} onClear={() => { setRoute([]); setRouteMode('idle') }} />
        <InfoPanel point={selectedPoint} onClear={() => setSelectedPoint(null)} />
      </aside>
    </section>
  </main>
}

export default App
