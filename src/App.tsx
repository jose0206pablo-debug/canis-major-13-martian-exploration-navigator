import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { SurfaceObservation, SurfaceStationList } from './surface/SurfaceObservation'
import { locateSurfaceStations, type LocatedSurfaceStation } from './surface/stations'
import { Attribution } from './components/Attribution'
import { CoordinateBar } from './components/CoordinateBar'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { InfoPanel } from './components/InfoPanel'
import { LayerPanel } from './components/LayerPanel'
import { Legend } from './components/Legend'
import { MapView } from './components/MapView'
import { RoutePanel, type ComparisonData, type GridStatus, type IllustrativeInfo, type RouteMode } from './components/RoutePanel'
import { ContextTrail, SCIENCE_DETAIL, SCIENCE_LABEL } from './components/ContextTrail'
import { MARS_GLOBE_CREDIT, PlanetaryLocator } from './components/PlanetaryLocator'
import { TopoLines } from './components/TopoLines'
import type { Terrain3DProfile } from './components/Terrain3D'
import { selectIllustrativeRoute } from './analysis/illustrative'
import { compareScenarios, finishAlternative, sharedProfileScale, sharesEndpoints, startAlternative as startAlternativeRoute } from './analysis/compare'
import { toProjected, type LonLat } from './analysis/geodesy'
import { computeProfile, PROFILE_SENSITIVITY_STEP_M, PROFILE_STEP_M, type ProfileResult } from './analysis/profile'
import { loadElevationGrid, sampleBilinear, type ElevationGrid } from './data/elevation'
import { catalog, RASTER_LAYER_IDS, WAYPOINT_LAYER_ID } from './data/layers'
import { loadManifest, type DataManifest } from './data/manifest'
import type { Layer, MapPoint, Selection } from './data/types'
import { loadWaypoints, type Waypoint } from './data/waypoints'

/** Perfil principal (≤ 10 m) y de sensibilidad (40 m) de una polilínea: el mismo cálculo para A, B y el recorrido libre. */
function profilePair(grid: ElevationGrid | null, route: LonLat[]): { main: ProfileResult | null; sensitivity: ProfileResult | null } {
  if (!grid || route.length < 2) return { main: null, sensitivity: null }
  const vertices = route.map(toProjected)
  const sampler = (x: number, y: number) => sampleBilinear(grid, x, y)
  return { main: computeProfile(vertices, sampler, PROFILE_STEP_M), sensitivity: computeProfile(vertices, sampler, PROFILE_SENSITIVITY_STEP_M) }
}

// CANIS NEXT · Relieve 3D experimental: se carga bajo demanda (chunk aparte) para no tocar el arranque del mapa 2D.
const Terrain3D = lazy(() => import('./components/Terrain3D').then((m) => ({ default: m.Terrain3D })))

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
  const [selectedSurface, setSelectedSurface] = useState<LocatedSurfaceStation | null>(null)
  const surfaceStations = useMemo(() => locateSurfaceStations(waypoints ?? []), [waypoints])
  const [selectedPoint, setSelectedPoint] = useState<Selection | null>(null)
  const [cursor, setCursor] = useState<MapPoint | null>(null)
  const [routeMode, setRouteMode] = useState<RouteMode>('idle')
  const [route, setRoute] = useState<LonLat[]>([])
  // V1.1: 'illustrative' cuando el recorrido mostrado es el escenario A (referencia ilustrativa).
  // V1.3: 'alternative' cuando es la alternativa B, que comparte exactamente origen y destino con A.
  const [routeKind, setRouteKind] = useState<'user' | 'illustrative' | 'alternative'>('user')
  // V1.5.1 FINAL: se entra siempre directamente al mapa científico; la vista planetaria separada se eliminó.
  const [show3d, setShow3d] = useState(false)
  const toggle3dRef = useRef<HTMLButtonElement>(null)

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
  const illustrativeRoute = useMemo(() => (waypoints ? selectIllustrativeRoute(waypoints) : null), [waypoints])
  const illustrativeInfo: IllustrativeInfo = {
    available: Boolean(illustrativeRoute),
    active: routeKind === 'illustrative',
    start: illustrativeRoute ? { rmc: illustrativeRoute.start.rmc, sol: illustrativeRoute.start.sol } : null,
    end: illustrativeRoute ? { rmc: illustrativeRoute.end.rmc, sol: illustrativeRoute.end.sol, elevGeoid: illustrativeRoute.end.elevGeoid } : null,
  }
  const routeEndLabels = useMemo<[string, string] | undefined>(() => (illustrativeRoute ? [`Inicio · sol ${illustrativeRoute.start.sol}`, `Destino · sol ${illustrativeRoute.end.sol}`] : undefined), [illustrativeRoute])
  // Perfil con el intervalo principal (≤ 10 m) y, solo para mostrar la sensibilidad del desnivel, con 40 m.
  const profiles = useMemo(() => profilePair(grid, route), [grid, route])
  // V1.3: escenario A calculado con la MISMA función y los mismos vértices que «Ver escenario A», solo durante la comparación.
  const comparingAlternative = routeKind === 'alternative' && Boolean(illustrativeRoute)
  const referenceRoute = comparingAlternative ? illustrativeRoute!.vertices : undefined
  const profilesA = useMemo(() => profilePair(grid, referenceRoute ?? []), [grid, referenceRoute])
  const comparison = useMemo<ComparisonData | null>(() => {
    if (!comparingAlternative || routeMode !== 'done' || !profiles.main || !profiles.sensitivity || !profilesA.main || !profilesA.sensitivity) return null
    if (!sharesEndpoints(referenceRoute!, route)) return null // salvaguarda: nunca comparar extremos distintos
    return { result: compareScenarios(profilesA.main, profilesA.sensitivity, profiles.main, profiles.sensitivity), a: profilesA.main, b: profiles.main, scale: sharedProfileScale(profilesA.main, profiles.main) }
  }, [comparingAlternative, routeMode, profiles, profilesA, referenceRoute, route])
  const referenceEndLabels = useMemo<[string, string] | undefined>(() => (illustrativeRoute ? [`Origen común · sol ${illustrativeRoute.start.sol}`, `Destino común · sol ${illustrativeRoute.end.sol}`] : undefined), [illustrativeRoute])
  function startAlternative() {
    setSelectedSurface(null); setShow3d(false)
    if (!illustrativeRoute) return
    setRoute(startAlternativeRoute(illustrativeRoute.vertices[0])); setRouteKind('alternative'); setRouteMode('drawing')
  }
  function finishRoute() {
    if (routeKind === 'alternative' && illustrativeRoute) {
      const [origin, destination] = illustrativeRoute.vertices
      setRoute((current) => finishAlternative(current, origin, destination))
    }
    setRouteMode('done')
  }

  // The 3D annotations use the very same samples that drive the 2D profile and A/B metrics.
  const terrainProfiles = useMemo<Terrain3DProfile[]>(() => {
    if (comparison) return [
      { id: 'a', label: 'Escenario A · referencia ilustrativa', color: '#7fdcff', profile: comparison.a },
      { id: 'b', label: 'Escenario B · alternativa', color: '#ffffff', profile: comparison.b },
    ]
    if (!profiles.main) return []
    if (routeKind === 'illustrative') return [
      { id: 'a', label: 'Escenario A · referencia ilustrativa', color: '#7fdcff', profile: profiles.main },
    ]
    return [{ id: 'user', label: 'Recorrido dibujado', color: '#ffffff', profile: profiles.main }]
  }, [comparison, profiles.main, routeKind])
  const terrainPalette = manifest?.layers.ctx_dtm_relief.palette
  const can3d = Boolean(grid && terrainPalette && routeMode !== 'drawing')
  function close3d() { setShow3d(false); requestAnimationFrame(() => toggle3dRef.current?.focus()) }

  function toggleLayer(layerId: string) {
    setVisibleLayerIds((current) => current.includes(layerId) ? current.filter((id) => id !== layerId) : [...current, layerId])
  }

  const status = dataStatus === 'ready' ? 'CTX 6 m · DTM 20 m' : dataStatus === 'loading' ? 'Cargando datos CTX…' : 'Derivados CTX no generados'
  const trailStats = dataStatus === 'ready' ? `CTX 6 m · DTM 20 m · ${waypoints?.length ?? 708} posiciones${surfaceStations.length ? ` · ${surfaceStations.length} observaciones de superficie` : ''}` : status


  return <main className="app-shell">
    {/* V1.4.1: cabecera de una sola franja. CANIS MAJOR 13 es el único bloque dominante; la salvaguarda va a la derecha;
        la información técnica pasa a la línea de contexto del mapa y la explicación de datos, al panel de capas. */}
    <header className="topbar compact">
      <TopoLines />
      <div className="brand">
        <h1 className="brand-title">CANIS MAJOR <span className="brand-num">13</span></h1>
        <p className="brand-sub">Martian Exploration Navigator <span>· NASA Space Apps Challenge 2026</span></p>
      </div>
      <DisclaimerBanner />
    </header>
    <section className="explorer-layout" aria-label="Explorador cartográfico de Jezero">
      <aside className="left-panel panel"><PlanetaryLocator /><p className="step-kicker layers-kicker">1 · Observar · 2 · Comprender</p><LayerPanel layers={layers} visibleLayerIds={visibleLayerIds} opacities={opacities} onToggle={toggleLayer} onOpacityChange={(id, opacity) => setOpacities((current) => ({ ...current, [id]: opacity }))} /><Legend layers={activeLayers} manifest={manifest} /><SurfaceStationList stations={surfaceStations} onSelect={setSelectedSurface} disabled={routeMode === 'drawing'} /><details className="panel-details"><summary>Detalles del conjunto de datos</summary><p><strong>{SCIENCE_LABEL}</strong> · {SCIENCE_DETAIL}.</p><p>Sector A del cráter Jezero con datos de NASA: imagen CTX de 6 m, relieve de 20 m y 708 posiciones históricas de Perseverance.</p><p>Mapa 2D · CRS marciano IAU_2015:49910 (esfera de 3 396 190 m).</p><p>{MARS_GLOBE_CREDIT}</p></details></aside>
      <section className="map-column with-trail"><ContextTrail stats={trailStats} /><div className="map-stage"><MapView surfaceStations={surfaceStations} onSurfaceSelect={setSelectedSurface} layers={layers} pois={catalog.pois} visibleLayerIds={visibleLayerIds} opacities={opacities} manifest={manifest} waypoints={waypoints} elevationAt={elevationAt} onPointSelect={(point) => { setSelectedSurface(null); setSelectedPoint(point) }} onCursorChange={setCursor} drawMode={routeMode === 'drawing'} route={route} onAddVertex={addVertex} routeVariant={routeKind === 'illustrative' ? 'illustrative' : 'user'} routeEndLabels={routeEndLabels} referenceRoute={referenceRoute} referenceEndLabels={referenceEndLabels} />
        {!show3d && <button ref={toggle3dRef} type="button" className="terrain3d-toggle" disabled={!can3d} onClick={() => setShow3d(true)}
          title={routeMode === 'drawing' ? 'Termina o borra el trazado para abrir el relieve 3D' : grid ? 'Vista 3D experimental del DTM CTX de 20 m' : 'Cargando el modelo de elevación…'}>
          <span aria-hidden="true">◭</span> Relieve 3D <small>experimental</small></button>}
        {show3d && grid && terrainPalette && <Suspense fallback={<p className="terrain3d-loading" role="status">Preparando el relieve 3D…</p>}>
          <Terrain3D grid={grid} palette={terrainPalette} profiles={terrainProfiles} onClose={close3d} /></Suspense>}</div><CoordinateBar cursor={cursor} elevationError={gridError} /><Attribution activeLayers={activeLayers} /></section>
      <aside className="right-panel panel">
        {selectedSurface && <SurfaceObservation key={selectedSurface.rmc} station={selectedSurface} onClose={() => setSelectedSurface(null)} />}
        <RoutePanel mode={routeMode} vertexCount={route.length} profile={profiles.main} sensitivity={profiles.sensitivity} gridStatus={gridStatus}
          onStart={() => { setSelectedSurface(null); setShow3d(false); setRoute([]); setRouteKind('user'); setRouteMode('drawing') }} onFinish={finishRoute} onClear={() => { setRoute([]); setRouteKind('user'); setRouteMode('idle') }}
          illustrative={illustrativeInfo} onShowIllustrative={() => { if (!illustrativeRoute) return; setSelectedSurface(null); setRoute(illustrativeRoute.vertices); setRouteKind('illustrative'); setRouteMode('done') }}
          alternativeActive={routeKind === 'alternative'} onStartAlternative={startAlternative} onUndo={() => setRoute((current) => (current.length > 1 ? current.slice(0, -1) : current))} comparison={comparison} />
        <InfoPanel point={selectedSurface ? null : selectedPoint} onClear={() => setSelectedPoint(null)} />
      </aside>
    </section>
  </main>
}

export default App
