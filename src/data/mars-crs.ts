// Parámetros del CRS de los productos CTX TRN, verificados con gdalinfo (03_DATOS/validacion_gdal/09_ y 23_).
export const MARS_SPHERE_RADIUS = 3_396_190
export const MARS_PROJ4 = '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=3396190 +b=3396190 +units=m +no_defs'
export const MARS_CRS_NAME = 'IAU_2015:49910'

// Esquina superior izquierda común del DTM (20 m) y del ortomosaico (6 m), en metros proyectados.
export const MARS_CRS_ORIGIN: [number, number] = [4573663.250853, 1109693.140188]

// m/píxel por nivel de zoom. z5 = 6 m, resolución nativa del ortomosaico; z6 (3 m) es solo ampliación visual.
export const MARS_CRS_RESOLUTIONS = [192, 96, 48, 24, 12, 6, 3]
export const ORTHO_NATIVE_ZOOM = 5

// Envolvente de ambos productos: el ortomosaico llega 12 m más al este que el DTM (VER-08).
export const MARS_CRS_BOUNDS = { west: 4573663.250853, south: 1079453.140188, east: 4605595.250853, north: 1109693.140188 }
