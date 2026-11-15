/**
 * V1.5.1c · Motivo de identidad de la cabecera: líneas que sugieren curvas de nivel / perfiles de elevación,
 * en el naranja CANIS. SVG local generado de forma determinista (sumas de senos): NO son datos topográficos,
 * solo identidad visual. Sin assets externos y sin animación; `aria-hidden` y sin eventos de puntero.
 */
const LINES = (() => {
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    let d = ''
    for (let x = 0; x <= 1200; x += 20) {
      const y = 12 + i * 11 + 7.5 * Math.sin(x / 132 + i * 1.7) + 4.5 * Math.sin(x / 47 + i * 2.9) + 2.4 * Math.sin(x / 19 + i * 1.3)
      d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`
    }
    out.push(d)
  }
  return out
})()

export function TopoLines() {
  return <svg className="topo-lines" viewBox="0 0 1200 96" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="topo-fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f76714" stopOpacity="0" />
        <stop offset=".16" stopColor="#f76714" stopOpacity=".55" />
        <stop offset=".62" stopColor="#f76714" stopOpacity="1" />
        <stop offset=".88" stopColor="#f76714" stopOpacity=".55" />
        <stop offset="1" stopColor="#f76714" stopOpacity=".2" />
      </linearGradient>
    </defs>
    {LINES.map((d, i) => <path key={i} d={d} stroke="url(#topo-fade)" strokeWidth={i === 3 ? 1.5 : 1} fill="none" opacity={0.14 + 0.08 * ((i * 2) % 4)} />)}
  </svg>
}
