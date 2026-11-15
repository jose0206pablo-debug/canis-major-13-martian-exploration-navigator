import type { Catalog, RasterLayerId } from './types'

export const RASTER_LAYER_IDS: RasterLayerId[] = ['ctx_ortho', 'ctx_dtm_relief', 'ctx_dtm_hillshade']
export const WAYPOINT_LAYER_ID = 'perseverance_waypoints'
export const VERTICAL_REFERENCE = 'Elevación respecto a un areoide compatible con MOLA (GMM3). El modelo exacto del CTX y su exactitud absoluta no están documentados.'
const CONTENT_OFFSET_NOTE = 'Posible desfase de contenido entre DTM y ortomosaico de 30–40 m (E-O), no demostrado; no se aplica corrección (VER-08).'

export const catalog: Catalog = {
  region: 'Jezero Crater — Sector A (TRN)',
  bounds: { north: 18.7212, south: 18.211, east: 77.6992, west: 77.1605 },
  sources: [
    { id: 'ctx_trn_dtm_20m', name: 'Mars 2020 TRN CTX DTM Mosaic 20 m (D-001)', organism: 'USGS Astrogeology Science Center', productId: 'JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0', url: 'https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_ctx_dtm_mosaic', attribution: 'DTM CTX: USGS Astrogeology (Fergason et al.); datos CTX NASA/JPL-Caltech/MSSS.', limitations: ['Resolución de 20 m/px: no resuelve rocas ni obstáculos menores.', VERTICAL_REFERENCE, 'Alineado al HRSC Level 5 DTM (residual vertical 3,8 m según FGDC). El FGDC dice "esfera": inconsistencia documental registrada.', CONTENT_OFFSET_NOTE] },
    { id: 'ctx_trn_ortho_6m', name: 'Mars 2020 TRN CTX Orthorectified Image Mosaic 6 m (D-004)', organism: 'USGS Astrogeology Science Center', productId: 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0', url: 'https://astrogeology.usgs.gov/search/map/Mars/Mars2020/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0', attribution: 'Ortomosaico CTX: USGS Astrogeology; datos CTX NASA/JPL-Caltech/MSSS.', limitations: ['Imagen monocromática: brillo relativo sin unidades físicas.', 'Mosaico de tres imágenes CTX ortorrectificadas; desplazamiento medio entre imágenes de 9,6 m (FGDC).', CONTENT_OFFSET_NOTE] },
    { id: 'perseverance_waypoints', name: 'Waypoints de Perseverance (D-005)', organism: 'NASA/JPL (MMGIS)', productId: 'M20_waypoints.json · colección M20_waypoints_sol2022_all', url: 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json', attribution: 'Waypoints: NASA/JPL-Caltech, Mars 2020 (MMGIS).', limitations: ['Son posiciones históricas del rover (soles 13–2022), no rutas humanas ni evaluaciones de transitabilidad.', 'La línea une posiciones sucesivas; no es el trazado exacto recorrido por el rover.', '22 de las 708 posiciones son interpoladas, no medidas.', 'elev_geoid es la altura publicada por MMGIS; su referencia no está documentada, pero coincide con el DTM (mediana −1,1 m).'] },
    { id: 'perseverance_landing', name: 'Referencia de aterrizaje Perseverance', organism: 'NASA/JPL', attribution: 'NASA/JPL — referencia de misión Perseverance.', limitations: ['Es contexto de misión; no es una ruta humana ni una evaluación de seguridad.'] },
  ],
  layers: [
    { id: 'ctx_ortho', name: 'Ortomosaico CTX 6 m', description: 'Imagen orbital CTX ortorrectificada (D-004), servida como tiles sin reproyección.', type: 'tiles', sourceId: 'ctx_trn_ortho_6m', category: 'measured', evidenceState: 'INTEGRATED', visibleDefault: true, defaultOpacity: 1, renderable: true, legend: 'ortho' },
    { id: 'ctx_dtm_relief', name: 'Elevación CTX DTM 20 m', description: 'Relieve coloreado del DTM (D-001) a su resolución nativa.', type: 'image', sourceId: 'ctx_trn_dtm_20m', category: 'derived', evidenceState: 'INTEGRATED', visibleDefault: false, defaultOpacity: 0.65, renderable: true, legend: 'elevation' },
    { id: 'ctx_dtm_hillshade', name: 'Relieve sombreado', description: 'Sombreado sintético calculado a partir del DTM (solo visual).', type: 'image', sourceId: 'ctx_trn_dtm_20m', category: 'derived', evidenceState: 'INTEGRATED', visibleDefault: false, defaultOpacity: 0.5, renderable: true, legend: 'hillshade', disclaimer: 'Luz sintética (azimut 315°, altitud 45°). Calculado con 20 m en x; la separación real E-O en Jezero es ~18,97 m.' },
    { id: 'perseverance_waypoints', name: 'Posiciones históricas de Perseverance', description: '708 localizaciones del rover entre los soles 13 y 2022 (NASA/JPL, MMGIS).', type: 'geojson', sourceId: 'perseverance_waypoints', category: 'contextual', evidenceState: 'INTEGRATED', visibleDefault: true, defaultOpacity: 1, renderable: true, legend: 'waypoints', disclaimer: 'Ubicaciones históricas del rover: no son rutas humanas seguras ni evaluaciones de transitabilidad.' },
    { id: 'perseverance_landing', name: 'Referencia Perseverance', description: 'Marcador de la misión, sin representar una ruta humana.', type: 'vector', sourceId: 'perseverance_landing', category: 'contextual', evidenceState: 'METADATA_VERIFIED', visibleDefault: true, defaultOpacity: 1, renderable: true, legend: 'marker', disclaimer: 'El marcador es contexto de misión y no constituye una recomendación de recorrido.' },
  ],
  pois: [
    { id: 'perseverance_landing', name: 'Sitio de aterrizaje Perseverance', description: 'Octavia E. Butler Landing (febrero de 2021). Referencia de misión para contextualizar el mapa.', category: 'mission', coordinates: { lat: 18.4447, lon: 77.4508 }, sourceId: 'perseverance_landing', evidenceState: 'METADATA_VERIFIED', limitations: ['No representa una ruta humana.', 'Coordenadas redondeadas a 4 decimales (~6 m).'] },
  ],
}
