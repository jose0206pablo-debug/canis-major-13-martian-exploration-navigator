import { SCIENTIFIC_LIMITS } from '../data/safeguards'

/**
 * Salvaguarda científica compacta (V1.2): una línea visible y TODOS los límites en el desplegable.
 * El texto completo de la V1.1 (no es navegación certificada…) encabeza la lista desplegable.
 */
export const SAFEGUARD_LEAD = 'Interpretación preliminar de datos orbitales'
export const SAFEGUARD_LINK = 'Ver límites científicos'
export const SAFEGUARD_TEXT = 'Herramienta educativa basada en datos orbitales: no es navegación certificada y no evalúa seguridad, habitabilidad, transitabilidad ni movilidad de astronautas.'

export function DisclaimerBanner() {
  return <section className="safeguard" aria-label="Salvaguarda científica">
    <details>
      <summary><span>{SAFEGUARD_LEAD}</span> · <span className="safeguard-link">{SAFEGUARD_LINK}</span></summary>
      <ul>
        <li>{SAFEGUARD_TEXT}</li>
        {SCIENTIFIC_LIMITS.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </details>
  </section>
}
