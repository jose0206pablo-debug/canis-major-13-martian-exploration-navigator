/** CANIS NEXT · Relieve 3D experimental: parámetros de visualización (no afectan a ningún cálculo). */
/** A vertex every 80 projected metres on desktop, 160 on narrow viewports. */
export const MESH_STRIDE_DESKTOP = 4
export const MESH_STRIDE_NARROW = 8
/** Exageraciones verticales disponibles; siempre se rotula la activa. */
export const EXAGGERATIONS = [1, 2, 3] as const
export const DEFAULT_EXAGGERATION = 1
export const TERRAIN_3D_TITLE = 'Relieve 3D · experimental'
export const TERRAIN_3D_LIMIT = 'Vista ilustrativa del relieve. No es navegación ni evaluación de seguridad o transitabilidad.'
