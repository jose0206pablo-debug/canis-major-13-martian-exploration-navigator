import { writeFileSync } from 'node:fs'

const pages = await (await fetch('http://127.0.0.1:9225/json/list')).json()
const page = pages.find((item) => item.type === 'page')
if (!page) throw new Error('No Chrome page target')
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
let nextId = 0
const pending = new Map()
const exceptions = []
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  if (message.id) {
    const item = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) item.reject(new Error(`${item.method}: ${message.error.message} (${item.detail})`))
    else item.resolve(message.result)
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text)
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject, method, detail: String(params.expression || '').slice(0, 100) })
  socket.send(JSON.stringify({ id, method, params }))
})
async function evaluate(expression, awaitPromise = false) {
  const output = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise })
  if (output.exceptionDetails) throw new Error(output.exceptionDetails.text)
  return output.result.value
}
async function waitFor(expression) {
  return evaluate(`new Promise((resolve, reject) => {
    const start = Date.now()
    const timer = setInterval(() => {
      const value = ${expression}
      if (value) { clearInterval(timer); resolve(true) }
      else if (Date.now() - start > 25000) { clearInterval(timer); reject(Error('timeout')) }
    }, 100)
  })`, true)
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(new URL(name, import.meta.url), Buffer.from(result.data, 'base64'))
}
async function clickText(label) {
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)})
    if (!button) return false
    button.click(); return true
  })()`)
  if (!clicked) throw new Error(`Button not found: ${label}`)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'http://127.0.0.1:5175/' })
await waitFor("document.querySelector('.terrain3d-toggle:not(:disabled)') && document.querySelectorAll('.leaflet-tile-loaded').length >= 2")
await clickText('Ver escenario A')
await waitFor("document.querySelector('.route-metrics') && document.querySelector('.terrain3d-toggle:not(:disabled)')")
await evaluate("document.querySelector('.terrain3d-toggle').click()")
await waitFor("document.querySelector('.terrain3d[data-state=ready]') && Number(document.querySelector('.terrain3d-canvas').dataset.frames) >= 1")
await delay(300)
const a = await evaluate(`({ legends: [...document.querySelectorAll('.terrain3d-legend li')].map(x => x.textContent), metrics: document.querySelector('.route-metrics')?.innerText })`)
await screenshot('after_3d_a_1440.png')
await clickText('Volver al mapa 2D ✕')
await clickText('Trazar alternativa B')
await waitFor("document.querySelector('.route-hint')?.textContent.includes('Alternativa B')")
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 710, y: 475, button: 'left', clickCount: 1 })
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 710, y: 475, button: 'left', clickCount: 1 })
await waitFor("document.querySelector('.route-hint')?.textContent.includes('1 punto')")
await clickText('Terminar en destino')
await waitFor("document.querySelector('.comparison-table')")
const b = await evaluate(`({ metrics: document.querySelector('.comparison-table')?.innerText, sentence: document.querySelector('.comparison-sentence')?.innerText })`)
await screenshot('after_2d_ab_1440.png')
await evaluate("document.querySelector('.terrain3d-toggle').click()")
await waitFor("document.querySelector('.terrain3d[data-state=ready]') && Number(document.querySelector('.terrain3d-canvas').dataset.frames) >= 1")
await delay(300)
const ab = await evaluate(`({ legends: [...document.querySelectorAll('.terrain3d-legend li')].map(x => x.textContent), lines: document.querySelector('.terrain3d')?.dataset.state })`)
await screenshot('after_3d_ab_1440.png')
const compassBefore = await evaluate("document.querySelector('.terrain3d-compass span')?.style.transform")
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 700, y: 450, button: 'left', clickCount: 1 })
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 830, y: 450, button: 'left', buttons: 1 })
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 830, y: 450, button: 'left', clickCount: 1 })
await delay(250)
const compassAfter = await evaluate("document.querySelector('.terrain3d-compass span')?.style.transform")
await clickText('Volver al mapa 2D ✕')

await evaluate(`(() => {
  window.__originalGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    if (type === 'webgl' || type === 'webgl2') return null
    return window.__originalGetContext.call(this, type, ...args)
  }
  return true
})()`)
await evaluate("document.querySelector('.terrain3d-toggle').click()")
await waitFor("document.querySelector('.terrain3d[data-state=no-webgl]')")
const fallback = await evaluate(`({ message: document.querySelector('.terrain3d-fallback')?.textContent, close: !!document.querySelector('.terrain3d-close') })`)
await screenshot('after_3d_no_webgl_1440.png')
await clickText('Volver al mapa 2D ✕')
await evaluate("HTMLCanvasElement.prototype.getContext = window.__originalGetContext")
const returned = await evaluate("!!document.querySelector('.leaflet-container') && !document.querySelector('.terrain3d')")

await evaluate("document.querySelector('.terrain3d-toggle').click()")
await waitFor("document.querySelector('.terrain3d[data-state=ready]')")
const extension = await evaluate(`(() => {
  const canvas = document.querySelector('.terrain3d-canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  const extension = gl?.getExtension('WEBGL_lose_context')
  if (!extension) return false
  extension.loseContext()
  return true
})()`)
let lost = false
if (extension) lost = Boolean(await waitFor("document.querySelector('.terrain3d[data-state=lost]')"))
await screenshot('after_3d_context_lost_1440.png')
await clickText('Volver al mapa 2D ✕')
const recovered2d = await evaluate("!!document.querySelector('.leaflet-container') && !document.querySelector('.terrain3d')")
const comparisonAfter3d = await evaluate("document.querySelector('.comparison-table')?.innerText")
const output = { a, b, ab, compassBefore, compassAfter, fallback, returned, extension, lost, recovered2d, comparisonPreserved: comparisonAfter3d === b.metrics, exceptions }
writeFileSync(new URL('ab_fallback_qa_results.json', import.meta.url), JSON.stringify(output, null, 2))
console.log(JSON.stringify(output, null, 2))
socket.close()
if (!a.legends.length || ab.legends.length !== 2 || !b.metrics || compassBefore === compassAfter || !fallback.close || !returned || !recovered2d || comparisonAfter3d !== b.metrics || exceptions.length || (extension && !lost)) process.exitCode = 1
