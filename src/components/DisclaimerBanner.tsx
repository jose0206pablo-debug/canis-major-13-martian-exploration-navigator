import { SCIENTIFIC_LIMITS } from '../data/safeguards'

/**
 * Salvaguarda científica compacta: una línea visible y TODOS los límites en el desplegable.
 * V1.3 (corrección de Codex): «No es navegación certificada» se ve sin desplegar.
 */
export const SAFEGUARD_LEAD = 'Interpretación preliminar de datos orbitales'
export const SAFEGUARD_NOT_CERTIFIED = 'No es navegación certificada'
export const SAFEGUARD_LINK = 'Ver límites científicos'
export const SAFEGUARD_TEXT = 'Herramienta educativa basada en datos orbitales: no es navegación certificada y no evalúa seguridad, habitabilidad, transitabilidad ni movilidad de astronautas.'

export function DisclaimerBanner() {
  return <section className="safeguard" aria-label="Salvaguarda científica">
    <details>
      <summary><span>{SAFEGUARD_LEAD}</span> · <strong className="safeguard-cert">{SAFEGUARD_NOT_CERTIFIED}</strong> · <span className="safeguard-link">{SAFEGUARD_LINK}</span></summary>
      <ul>
        <li>{SAFEGUARD_TEXT}</li>
        {SCIENTIFIC_LIMITS.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </details>
  </section>
}
