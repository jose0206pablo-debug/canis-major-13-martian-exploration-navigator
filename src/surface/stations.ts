import type { Waypoint } from '../data/waypoints'

export interface SurfaceStation {
  rmc: string
  waypointSol: number
  imageSol: number
  camera: string
  productId: string
  date: string
  lmst: string
  width: number
  height: number
  credit: string
  description: string
  alt: string
}

/** Observaciones contextuales. No son objetivos científicos ni huellas fotográficas. */
export const SURFACE_STATIONS: readonly SurfaceStation[] = [
  { rmc: '33_366', waypointSol: 700, imageSol: 700, camera: 'Mastcam-Z derecha', productId: 'ZR0_0700_0729093942_894ECM_N0330366ZCAM08699_1100LMJ', date: '2023-02-08', lmst: '15:34:30', width: 1648, height: 1200, credit: 'NASA/JPL-Caltech/ASU', description: 'Terreno local con fragmentos rocosos y superficies fracturadas; no es una panorámica regional.', alt: 'Vista monocromática del suelo con rocas dispersas y superficies fracturadas.' },
  { rmc: '47_4404', waypointSol: 1000, imageSol: 1000, camera: 'Mastcam-Z derecha', productId: 'ZR0_1000_0755729009_894ECM_N0474404ZCAM07114_0340LMJ', date: '2023-12-13', lmst: '16:18:26', width: 1648, height: 1200, credit: 'NASA/JPL-Caltech/ASU', description: 'Encuadre local de rocas, sombras y material fino; complementa la escala regional del mapa.', alt: 'Vista monocromática de rocas de formas diversas sobre suelo con material fino.' },
  { rmc: '57_0', waypointSol: 1250, imageSol: 1250, camera: 'Navcam derecha', productId: 'NRF_1250_0777916348_292ECM_N0570000NCAM03250_04_195J', date: '2024-08-26', lmst: '14:36:01', width: 1288, height: 968, credit: 'NASA/JPL-Caltech', description: 'Ladera rocosa con horizonte visible; una parte del rover ocupa el borde inferior.', alt: 'Ladera con rocas dispersas y horizonte; parte del rover aparece abajo.' },
  { rmc: '64_0', waypointSol: 1354, imageSol: 1356, camera: 'Mastcam-Z derecha', productId: 'ZR0_1356_0787317174_285EBY_N0640000ZCAM09420_1100LMJ', date: '2024-12-12', lmst: '12:05:48', width: 1648, height: 1200, credit: 'NASA/JPL-Caltech/ASU', description: 'Vista local de una superficie con rocas dispersas y material fino, adquirida dos soles después del waypoint.', alt: 'Superficie con numerosos fragmentos rocosos y material fino entre ellos.' },
]

export type LocatedSurfaceStation = SurfaceStation & { waypoint: Waypoint }

/** La posición del marcador se lee del GeoJSON existente, nunca se infiere de la fotografía. */
export function locateSurfaceStations(waypoints: readonly Waypoint[]): LocatedSurfaceStation[] {
  return SURFACE_STATIONS.flatMap((station) => {
    const waypoint = waypoints.find((w) => w.rmc === station.rmc && w.sol === station.waypointSol)
    return waypoint ? [{ ...station, waypoint }] : []
  })
}

export function associationText(station: SurfaceStation): string {
  return station.imageSol === station.waypointSol
    ? 'Observación de Perseverance del mismo sol y código de sitio/desplazamiento que esta posición histórica. El área fotografiada no está delimitada sobre CTX.'
    : `Imagen adquirida dos soles después del registro de esta posición histórica, con el mismo código de sitio/desplazamiento ${station.rmc}. El área fotografiada no está delimitada sobre CTX.`
}

export const nasaPage = (s: SurfaceStation) => `https://mars.nasa.gov/mars2020/multimedia/raw-images/${s.productId}`
export const nasaImage = (s: SurfaceStation) => `https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/${String(s.imageSol).padStart(5, '0')}/ids/edr/browse/${s.camera.startsWith('Navcam') ? 'ncam' : 'zcam'}/${s.productId}01.png`
export const localSurfaceImage = (s: SurfaceStation) => `${import.meta.env.BASE_URL}surface/${s.productId}01.webp`
