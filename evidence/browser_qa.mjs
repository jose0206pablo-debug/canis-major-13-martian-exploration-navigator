import { writeFileSync } from 'node:fs'

// Start Chrome headless with --remote-debugging-port=9225, then:
// node evidence/browser_qa.mjs 9225 5175
const cdpPort = Number(process.argv[2] || 9225)
const appPort = Number(process.argv[3] || 5175)
const pages = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()
const page = pages.find((item) => item.type === 'page')
if (!page) throw new Error('No Chrome page target')
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
let nextId = 0
const pending = new Map()
const exceptions = []
const requests = []
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  if (message.id) {
    const handler = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) handler.reject(new Error(message.error.message))
    else handler.resolve(message.result)
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text)
  if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url)
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params }))
})
async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitFor(expression, timeoutMs = 25000) {
  const quoted = JSON.stringify(expression)
  return evaluate(`new Promise((resolve, reject) => {
    const started = Date.now()
    const timer = setInterval(() => {
      let value
      try { value = eval(${quoted}) } catch { value = null }
      if (value) { clearInterval(timer); resolve(value) }
      if (Date.now() - started > ${timeoutMs}) {
        clearInterval(timer); reject(new Error('Timed out: ' + ${quoted}))
      }
    }, 100)
  })`, true)
}
async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(new URL(name, import.meta.url), Buffer.from(result.data, 'base64'))
}

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
const results = []
for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [390, 844], [360, 800]]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 390 })
  await send('Page.navigate', { url: `http://127.0.0.1:${appPort}/` })
  await delay(250)
  await waitFor("document.querySelector('.terrain3d-toggle:not(:disabled)') && document.querySelectorAll('.leaflet-tile-loaded').length >= 2")
  await delay(600)
  if (width === 1440) await screenshot('after_2d_1440.png')
  const started = performance.now()
  await evaluate("document.querySelector('.terrain3d-toggle').click()")
  await waitFor("document.querySelector('.terrain3d[data-state=ready]') && Number(document.querySelector('.terrain3d-canvas').dataset.frames) >= 1")
  const readyMs = Math.round(performance.now() - started)
  await delay(350)
  await screenshot(`after_3d_${width}x${height}.png`)
  const initial = await evaluate(`(() => ({
    state: document.querySelector('.terrain3d')?.dataset.state,
    vertices: Number(document.querySelector('.terrain3d')?.dataset.meshVertices),
    triangles: Number(document.querySelector('.terrain3d')?.dataset.meshTriangles),
    vertical1x: document.querySelector('.terrain3d-exag button[aria-pressed=true]')?.textContent,
    mapTiles: document.querySelectorAll('.leaflet-tile-loaded').length
  }))()`)
  await evaluate(`document.querySelectorAll('.terrain3d-exag button')[2].click()`)
  const vertical3x = await evaluate("document.querySelector('.terrain3d-exag button[aria-pressed=true]')?.textContent")
  await evaluate("document.querySelector('.terrain3d-close').click()")
  const returned2d = await waitFor("!document.querySelector('.terrain3d') && document.querySelector('.terrain3d-toggle') && document.querySelectorAll('.leaflet-tile-loaded').length >= 2")
  results.push({ viewport: `${width}x${height}`, readyMs, ...initial, vertical3x, returned2d: Boolean(returned2d) })
}
const externalRequests = requests.filter((url) => /^https?:/.test(url) &&
  !url.startsWith(`http://127.0.0.1:${appPort}/`))
const output = { results, externalRequests, exceptions }
writeFileSync(new URL('browser_qa_results.json', import.meta.url), JSON.stringify(output, null, 2))
console.log(JSON.stringify(output, null, 2))
socket.close()
if (externalRequests.length || exceptions.length || results.some((item) =>
  item.state !== 'ready' || item.vertical1x !== '×1' || item.vertical3x !== '×3' || !item.returned2d)) process.exitCode = 1
