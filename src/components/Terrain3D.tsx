import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ProfileResult } from '../analysis/profile'
import type { ElevationGrid } from '../data/elevation'
import type { PaletteStop } from '../data/manifest'
import { DEFAULT_EXAGGERATION, EXAGGERATIONS, MESH_STRIDE_DESKTOP, MESH_STRIDE_NARROW, TERRAIN_3D_LIMIT, TERRAIN_3D_TITLE } from '../terrain/config'
import { buildTerrainMesh, meshColors, profileRunsTo3D } from '../terrain/mesh'

export interface Terrain3DProfile {
  id: 'a' | 'b' | 'user'
  label: string
  color: string
  profile: ProfileResult
}
export interface Terrain3DProps {
  grid: ElevationGrid
  palette: readonly PaletteStop[]
  profiles: readonly Terrain3DProfile[]
  onClose: () => void
}

type ViewState = 'init' | 'ready' | 'no-webgl' | 'lost' | 'failed'

/** Three.js is loaded only when this component is opened; the 2D map owns the scientific results. */
export function Terrain3D({ grid, palette, profiles, onClose }: Terrain3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const compassArrowRef = useRef<HTMLSpanElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const terrainRef = useRef<THREE.Mesh | null>(null)
  const linesRef = useRef<THREE.Group | null>(null)
  const drawRef = useRef<() => void>(() => {})
  const homeRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const exaggerationRef = useRef(DEFAULT_EXAGGERATION)
  const [state, setState] = useState<ViewState>('init')
  const [exaggeration, setExaggeration] = useState<number>(DEFAULT_EXAGGERATION)
  const narrow = typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 850px)').matches
  const stride = narrow ? MESH_STRIDE_NARROW : MESH_STRIDE_DESKTOP
  const mesh = useMemo(() => buildTerrainMesh(grid, stride), [grid, stride])

  useEffect(() => { closeRef.current?.focus() }, [])
  useEffect(() => {
    exaggerationRef.current = exaggeration
    terrainRef.current?.scale.setY(exaggeration)
    linesRef.current?.scale.setY(exaggeration)
    drawRef.current()
  }, [exaggeration])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null
    try {
      context = canvas.getContext('webgl2', { antialias: true }) ??
        canvas.getContext('webgl', { antialias: true })
    } catch { /* Browser declined a WebGL context. */ }
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' &&
      context instanceof WebGL2RenderingContext
    if (!context || (!isWebGL2 && !context.getExtension('OES_element_index_uint'))) {
      queueMicrotask(() => setState('no-webgl'))
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, context, antialias: true, powerPreference: 'high-performance',
      })
    } catch {
      queueMicrotask(() => setState('failed'))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#05070f')
    scene.add(new THREE.HemisphereLight('#dce9fa', '#52402e', 1.6))
    const sun = new THREE.DirectionalLight('#fff2df', 1.8)
    sun.position.set(-13, 23, -17)
    scene.add(sun)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(mesh.uvs, 2))
    geometry.setAttribute('color', new THREE.BufferAttribute(meshColors(mesh, palette), 3))
    geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1))
    geometry.computeVertexNormals()
    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true, side: THREE.DoubleSide, roughness: 1, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2,
    })
    const terrain = new THREE.Mesh(geometry, terrainMaterial)
    terrain.scale.setY(exaggerationRef.current)
    scene.add(terrain)
    terrainRef.current = terrain

    const lines = new THREE.Group()
    const lineGeometries: THREE.BufferGeometry[] = []
    const lineMaterials: THREE.LineBasicMaterial[] = []
    for (const item of profiles) {
      for (const run of profileRunsTo3D(item.profile, mesh)) {
        const lineGeometry = new THREE.BufferGeometry()
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(run, 3))
        const lineMaterial = item.id === 'a'
          ? new THREE.LineDashedMaterial({ color: item.color, dashSize: 0.22, gapSize: 0.13, depthTest: false })
          : new THREE.LineBasicMaterial({ color: item.color, depthTest: false })
        const line = new THREE.Line(lineGeometry, lineMaterial)
        if (item.id === 'a') line.computeLineDistances()
        line.renderOrder = 2
        lines.add(line)
        lineGeometries.push(lineGeometry)
        lineMaterials.push(lineMaterial)
      }
    }
    lines.scale.setY(exaggerationRef.current)
    scene.add(lines)
    linesRef.current = lines

    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 200)
    const home = narrow ? new THREE.Vector3(0, 43, 50) : new THREE.Vector3(0, 34, 39)
    homeRef.current.copy(home)
    camera.position.copy(home)
    cameraRef.current = camera
    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 0, 0)
    controls.enableDamping = false
    controls.minDistance = 8
    controls.maxDistance = 100
    controls.maxPolarAngle = Math.PI * 0.49
    controls.update()
    controlsRef.current = controls

    let pending = 0
    let lost = false
    const requestRender = () => {
      if (pending || lost) return
      pending = requestAnimationFrame(() => {
        pending = 0
        // The camera can orbit: a fixed north arrow would give a false bearing.
        const center = new THREE.Vector3(0, 0, 0).project(camera)
        const north = new THREE.Vector3(0, 0, -1).project(camera)
        const dx = north.x - center.x
        const dy = -(north.y - center.y)
        if (compassArrowRef.current && Math.hypot(dx, dy) > 1e-6) {
          compassArrowRef.current.style.transform = `rotate(${Math.atan2(dx, -dy)}rad)`
        }
        renderer.render(scene, camera)
        canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1)
      })
    }
    drawRef.current = requestRender
    controls.addEventListener('change', requestRender)
    const resize = () => {
      const width = Math.max(1, canvas.clientWidth)
      const height = Math.max(1, canvas.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      requestRender()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      setState('lost')
    }
    canvas.addEventListener('webglcontextlost', onLost)
    queueMicrotask(() => setState('ready'))

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      cancelAnimationFrame(pending)
      observer.disconnect()
      controls.removeEventListener('change', requestRender)
      controls.dispose()
      geometry.dispose()
      terrainMaterial.dispose()
      lineGeometries.forEach((item) => item.dispose())
      lineMaterials.forEach((item) => item.dispose())
      renderer.dispose()
      drawRef.current = () => {}
      cameraRef.current = null
      controlsRef.current = null
      terrainRef.current = null
      linesRef.current = null
    }
  }, [mesh, palette, profiles, narrow])

  const reset = () => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.copy(homeRef.current)
    controls.target.set(0, 0, 0)
    controls.update()
    drawRef.current()
  }

  return <section className="terrain3d" role="region" aria-label={TERRAIN_3D_TITLE}
    data-state={state} data-mesh-vertices={mesh.vertices} data-mesh-triangles={mesh.triangles}
    onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
    <canvas ref={canvasRef} className="terrain3d-canvas" tabIndex={0}
      aria-label={`Vista 3D del DTM CTX de 20 m. Exageración vertical ${exaggeration}×. Arrastra para girar, rueda o pellizco para acercar; arrastre derecho para desplazar.`} />
    {state === 'no-webgl' && <p className="terrain3d-fallback" role="status">WebGL no está disponible. Vuelve al mapa 2D para seguir usando las capas, los perfiles y A/B.</p>}
    {state === 'lost' && <p className="terrain3d-fallback" role="status">Se perdió el contexto gráfico. Vuelve al mapa 2D; tus recorridos y resultados siguen allí.</p>}
    {state === 'failed' && <p className="terrain3d-fallback" role="status">No se pudo iniciar el relieve 3D. El mapa 2D sigue disponible.</p>}
    <header className="terrain3d-bar">
      <p className="terrain3d-title">{TERRAIN_3D_TITLE}</p>
      <button ref={closeRef} type="button" className="terrain3d-close" aria-label="Volver al mapa 2D" onClick={onClose}>
        <span className="terrain3d-close-long">Volver al </span>mapa 2D <span aria-hidden="true">✕</span>
      </button>
    </header>
    <div className="terrain3d-controls">
      <div className="terrain3d-exag" role="group" aria-label="Exageración vertical">
        <span className="terrain3d-exag-label">Exageración vertical</span>
        {EXAGGERATIONS.map((value) => <button key={value} type="button" aria-pressed={exaggeration === value}
          onClick={() => setExaggeration(value)}>×{value}</button>)}
      </div>
      <button type="button" className="terrain3d-reset" onClick={reset}>Vista inicial</button>
    </div>
    <span className="terrain3d-compass" aria-hidden="true">N<br /><span ref={compassArrowRef} style={{ display: 'inline-block' }}>↑</span></span>
    <footer className="terrain3d-info">
      <p className="terrain3d-key"><strong>Escala vertical {exaggeration}×</strong> · malla DTM real · {TERRAIN_3D_LIMIT}</p>
      {profiles.length > 0 && <ul className="terrain3d-legend">
        {profiles.map((item) => <li key={item.id}><i style={{ background: item.color }} />{item.label}</li>)}
      </ul>}
      <details className="terrain3d-details">
        <summary>Datos y límites del relieve 3D</summary>
        <ul>
          <li>DTM CTX D-001: cuadrícula original de 20 m; malla de un nodo cada {stride} píxeles ({stride * grid.pixelSize} m proyectados). Los nodos conservan alturas originales. Entre nodos, los triángulos interpolan visualmente.</li>
          <li>Extensión local aproximada: {mesh.physicalWidthKm.toFixed(2)} × {mesh.physicalHeightKm.toFixed(2)} km. El eje este-oeste se corrige por la latitud central de Jezero.</li>
          <li>Elevación de {mesh.minElevation.toFixed(0)} a {mesh.maxElevation.toFixed(0)} m respecto a un areoide compatible con MOLA; el modelo exacto y la exactitud absoluta no están establecidos. Celdas NoData originales: {mesh.sourceNoData}.</li>
          <li>Los trazados A/B usan exactamente las muestras ya calculadas para los perfiles 2D. Se superponen para facilitar la lectura, incluso detrás del relieve; no indican visibilidad ni transitabilidad. Los huecos NoData interrumpen la línea.</li>
          <li>Colores de la paleta DTM; iluminación sintética. La ortoimagen CTX no se superpone aquí porque su registro fino con el DTM sigue pendiente de puntos de control.</li>
          <li>Renderizador Three.js: <a href={`${import.meta.env.BASE_URL}third_party_3d_license.txt`}>aviso de licencia MIT</a>.</li>
        </ul>
      </details>
    </footer>
  </section>
}
