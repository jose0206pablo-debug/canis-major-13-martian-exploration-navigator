import { useCallback, useEffect, useRef, useState } from 'react'
import { SAFEGUARD_LEAD, SAFEGUARD_TEXT, SCIENTIFIC_LIMITS, SCOPE_BLOCKS, SCOPE_BUTTON, SCOPE_MORE, SCOPE_TITLE } from '../data/safeguards'

/**
 * V1.5.1c · Indicador de alcance científico (cabecera, zona superior derecha) + ficha flotante.
 * - Indicador compacto: «ANÁLISIS PRELIMINAR · Alcance y límites ⓘ».
 * - La ficha queda CONFINADA al ancho de la columna derecha: puede superponerse al panel derecho, nunca al mapa;
 *   no cambia la altura de la cabecera ni desplaza la composición (position: fixed, medida sobre `.right-panel`
 *   al abrirse y en cada redimensionado). Si el contenido no cabe, se desplaza por dentro.
 * - Nada se elimina: el texto íntegro y los límites científicos completos viven en el desplegable
 *   «Ver metodología y limitaciones completas →» dentro de la ficha.
 */
const ICONS: readonly string[] = [
  'M12 3 3 8l9 5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  'M4 5h16v11H4Zm6 14h4m-8 0h12',
  'M12 4v4m0 8v4M4 12h4m8 0h4M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  'M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7.5 6.5l9 3m-8 7 7-8.5',
]

export function DisclaimerBanner() {
  const [open, setOpen] = useState(false)
  const [box, setBox] = useState<{ left: number; width: number; top: number; maxHeight: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)

  const place = useCallback(() => {
    const panel = document.querySelector('.right-panel')
    const b = btn.current
    if (!panel || !b) return
    const pr = panel.getBoundingClientRect()
    const under = b.getBoundingClientRect().bottom + 8
    // Alineada con el borde superior del panel derecho cuando este es visible; si queda bajo el pliegue (móvil),
    // se ancla bajo el botón para que la ficha sea visible. El confinamiento HORIZONTAL siempre es el del panel.
    const top = pr.top >= 0 && pr.top < window.innerHeight - 220 ? Math.max(under, pr.top) : under
    setBox({ left: Math.round(pr.left), width: Math.round(pr.width), top: Math.round(top), maxHeight: Math.max(180, Math.round(window.innerHeight - top - 14)) })
  }, [])

  useEffect(() => {
    if (!open) return
    const button = btn.current
    place()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!pop.current?.contains(t) && !button?.contains(t)) setOpen(false) }
    window.addEventListener('resize', place)
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown, true)
      button?.focus({ preventScroll: true })
    }
  }, [open, place])

  // El popover se monta cuando `box` llega del primer `place()`: solo entonces puede recibir el foco.
  const focusedOnce = useRef(false)
  useEffect(() => {
    if (!open) { focusedOnce.current = false; return }
    if (box && !focusedOnce.current) { focusedOnce.current = true; pop.current?.focus({ preventScroll: true }) }
  }, [open, box])

  return <>
    <button ref={btn} type="button" className="scope-button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
      <span className="scope-warn" aria-hidden="true">⚠</span> {SCOPE_BUTTON} <span className="scope-info" aria-hidden="true">ⓘ</span>
    </button>
    {open && box && <div ref={pop} tabIndex={-1} role="dialog" aria-label={SCOPE_TITLE} className="scope-popover" style={{ left: box.left, width: box.width, top: box.top, maxHeight: box.maxHeight }}>
      <div className="scope-head">
        <h2>{SCOPE_TITLE}</h2>
        <button type="button" className="scope-close" onClick={() => setOpen(false)} aria-label="Cerrar alcance y límites">✕</button>
      </div>
      <ScopeContent />
    </div>}
  </>
}

/** Contenido de la ficha (también para pruebas). */
export function ScopeContent() {
  return <div className="scope-body">
    {SCOPE_BLOCKS.map((block, i) => <section className="scope-block" key={block.title}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICONS[i]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div><h3>{block.title}</h3><p>{block.body}</p></div>
    </section>)}
    <details className="scope-full">
      <summary>{SCOPE_MORE}</summary>
      <p>{SAFEGUARD_LEAD}. {SAFEGUARD_TEXT}</p>
      <ul>{SCIENTIFIC_LIMITS.map((item) => <li key={item}>{item}</li>)}</ul>
      <p>La metodología de cada capa y de cada métrica está en los «Detalles» del panel de capas, en «Cómo se calcula» del panel de recorridos y en la ficha de cada punto consultado.</p>
    </details>
  </div>
}
