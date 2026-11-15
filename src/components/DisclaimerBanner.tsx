import { SCIENTIFIC_LIMITS } from '../data/safeguards'

/**
 * Salvaguarda científica compacta. V1.5.1: la línea visible queda en «No es navegación certificada · Límites»
 * (mucho menos espacio); «Interpretación preliminar de datos orbitales», el texto completo y TODOS los límites
 * siguen siempre en el DOM, dentro del desplegable.
 */
export const SAFEGUARD_LEAD = 'Interpretación preliminar de datos orbitales'
export const SAFEGUARD_NOT_CERTIFIED = 'No es navegación certificada'
export const SAFEGUARD_LINK = 'Límites'
export const SAFEGUARD_TEXT = 'Herramienta educativa basada en datos orbitales: no es navegación certificada y no evalúa seguridad, habitabilidad, transitabilidad ni movilidad de astronautas.'

export function DisclaimerBanner() {
  return <section className="safeguard" aria-label="Salvaguarda científica">
    <details>
      <summary><strong className="safeguard-cert">{SAFEGUARD_NOT_CERTIFIED}</strong> · <span className="safeguard-link">{SAFEGUARD_LINK}</span></summary>
      <ul>
        <li>{SAFEGUARD_LEAD}. {SAFEGUARD_TEXT}</li>
        {SCIENTIFIC_LIMITS.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </details>
  </section>
}
