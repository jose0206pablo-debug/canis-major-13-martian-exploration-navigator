/** Límites científicos que se despliegan en la salvaguarda de la cabecera (V1.1). Mismo contenido que los avisos de la V1. */
export const SCIENTIFIC_LIMITS = [
  'Resolución: relieve de 20 m e imagen de 6 m por píxel; no se distinguen rocas ni escalones.',
  'Posible desfase de 30–40 m entre relieve e imagen, no demostrado y sin corregir.',
  'Elevaciones respecto a un areoide compatible con MOLA, según evidencia de contraste; revisión independiente pendiente.',
  'Las posiciones de Perseverance son históricas: no son rutas para personas.',
  'Jezero se muestra como disco nominal (aproximado); solo el Sector A tiene datos CTX de alta resolución.',
]

/** V1.2/V1.3 · Lo que el escenario A NO es (desplegable, siempre en el DOM). */
export const ILLUSTRATIVE_IS_NOT = [
  'Usa dos posiciones históricas documentadas; la línea recta entre ellas es una construcción de CANIS, no un dato de misión.',
  'No es el trayecto real que siguió Perseverance.',
  'No se eligió por interés geológico: los extremos salen únicamente de la regla reproducible.',
  'No es una recomendación.',
  'No es seguro: no evalúa obstáculos, pendientes locales ni riesgos.',
  'No es óptimo: CANIS no busca ni calcula caminos.',
  'No certifica la transitabilidad del terreno.',
]

/** V1.5.1c · Indicador de alcance científico (cabecera) y su ficha flotante. */
export const SCOPE_BUTTON = 'ANÁLISIS PRELIMINAR · Alcance y límites'
/** V1.5.2 · Condición de auditoría: la no certificación debe ser visible SIN abrir el popover. */
export const SCOPE_NOT_CERTIFIED = 'No es navegación certificada'
export const SCOPE_TITLE = 'Alcance científico y limitaciones'
export const SCOPE_MORE = 'Ver metodología y limitaciones completas →'
export const SCOPE_BLOCKS: readonly { title: string; body: string }[] = [
  { title: 'Análisis topográfico preliminar', body: 'CANIS integra datos orbitales y posiciones históricas de Perseverance para explorar el relieve y comparar escenarios hipotéticos. No constituye navegación EVA operacional.' },
  { title: 'Escala de análisis', body: 'CTX ~6 m/píxel · DTM ~20 m/píxel. Adecuado para análisis regional; no caracteriza obstáculos pequeños.' },
  { title: 'Registro y elevación', body: 'Posible desplazamiento ~30–40 m entre imagen y relieve. Elevaciones compatibles con la referencia MOLA según la comprobación realizada; revisión independiente pendiente.' },
  { title: 'Cobertura y trazabilidad', body: 'El análisis de alta resolución corresponde al Sector A. Las 708 posiciones de Perseverance son referencias históricas, no una trayectoria exacta para personas.' },
]
/** Texto íntegro de la salvaguarda (conservado completo en «metodología y limitaciones completas»). */
export const SAFEGUARD_LEAD = 'Interpretación preliminar de datos orbitales'
export const SAFEGUARD_TEXT = 'Herramienta basada en datos orbitales: no es navegación certificada y no evalúa seguridad, habitabilidad, transitabilidad ni movilidad de astronautas.'
