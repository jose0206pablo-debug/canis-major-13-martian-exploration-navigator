import { SCIENTIFIC_LIMITS } from '../data/safeguards'

/**
 * Salvaguarda científica breve y siempre visible (V1.1). Sustituye al bloque grande de «Alcance educativo» de la V1:
 * primero se explica qué hace la herramienta (cabecera) y después sus límites, que se despliegan aquí.
 */
export const SAFEGUARD_TEXT = 'Herramienta educativa basada en datos orbitales: no es navegación certificada y no evalúa seguridad, habitabilidad, transitabilidad ni movilidad de astronautas.'


export function DisclaimerBanner() {
  return <section className="safeguard" aria-label="Salvaguarda científica">
    <p><strong>Aviso:</strong> {SAFEGUARD_TEXT}</p>
    <details>
      <summary>Límites científicos</summary>
      <ul>{SCIENTIFIC_LIMITS.map((item) => <li key={item}>{item}</li>)}</ul>
    </details>
  </section>
}
