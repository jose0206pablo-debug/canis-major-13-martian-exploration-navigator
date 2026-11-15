/**
 * V1.5.1 FINAL · Barra contextual compacta sobre el mapa: MARTE / JEZERO / SECTOR A + resumen de datos.
 * La narrativa planetaria completa vive en el localizador compacto del panel izquierdo; el detalle
 * (CRS, «datos científicos georreferenciados») está en «Detalles del conjunto de datos».
 */
export const SCIENCE_LABEL = 'Datos científicos georreferenciados'
export const SCIENCE_DETAIL = 'CTX + DTM + posiciones + escenarios'

export function ContextTrail({ stats }: { stats?: string }) {
  return <nav className="context-trail" aria-label={SCIENCE_LABEL}>
    <ol><li>Marte</li><li>Jezero</li><li aria-current="location">Sector A</li></ol>
    {stats && <p className="context-trail-stats">{stats}</p>}
  </nav>
}
