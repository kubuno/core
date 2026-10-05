#!/usr/bin/env node
// Captures the `.kbview` element gallery (vite.gallery.config.ts) in headless Chrome: every page in light and dark,
// LTR and RTL, at 390 and 1280 px. Its own Chrome profile and debugging port, one tab, Chrome quit at the end; the
// gallery is served from its static build by a small server of this script (no network access needed).
//
//   npx vite build --config vite.gallery.config.ts
//   node scripts/capture-gallery.mjs --out /tmp/gallery-captures [--pages Label,Panel] [--chrome /usr/bin/google-chrome]
//
// Writes <out>/<page>-<light|dark>-<ltr|rtl>-<390|1280>.png, plus <page>-…-hover.png for a page with an element
// whose AccessibleDescription is "gallery-hover" (the pointer rests on it) and <page>-…-open.png for one marked
// "gallery-click" (it is clicked first: a menu, a popover). report.json lists the captures and the console errors.
import { spawn } from 'node:child_process'
import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fe = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback }
const dist = resolve(fe, arg('--dist', 'dist-gallery'))
const out = resolve(arg('--out', join(tmpdir(), 'kbview-gallery')))
const chromePath = arg('--chrome', process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome')
const debugPort = Number(arg('--port', '9341'))
const themes = arg('--themes', 'light,dark').split(',')
const dirs = arg('--dirs', 'ltr,rtl').split(',')
const widths = arg('--widths', '390,1280').split(',').map(Number)
const allPages = readdirSync(join(fe, 'src', 'gallery', 'pages')).filter((f) => f.endsWith('.ts')).map((f) => f.slice(0, -3)).sort()
const pages = arg('--pages', '') ? arg('--pages').split(',') : allPages

if (!existsSync(join(dist, 'gallery.html'))) throw new Error(`no gallery build in ${dist}: run npx vite build --config vite.gallery.config.ts`)
mkdirSync(out, { recursive: true })

// ── Static server for the build ──
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webp': 'image/webp' }
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = join(dist, path === '/' ? 'gallery.html' : path)
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

// ── Chrome (own profile, one tab) ──
const profile = join(tmpdir(), `kbview-gallery-chrome-${process.pid}`)
rmSync(profile, { recursive: true, force: true })
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`, '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--force-color-profile=srgb', '--font-render-hinting=none',
  '--hide-scrollbars', '--window-size=1280,900', 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let version = null
for (let i = 0; i < 100 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json() } catch { await sleep(200) }
}
if (!version) throw new Error('chrome did not start')
const page = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pending = new Map()
const listeners = []
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve: ok, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else ok(msg.result)
  } else if (msg.method) for (const l of listeners) l(msg)
})
const send = (method, params = {}) => new Promise((ok, reject) => {
  const id = ++seq
  pending.set(id, { resolve: ok, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`)
  return r.result.value
}
const errors = []
listeners.push((m) => {
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description ?? m.params.exceptionDetails?.text)
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) errors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
})
await send('Page.enable')
await send('Runtime.enable')
// Focus rings and :focus-visible as in a focused window (headless tabs are not focused).
await send('Emulation.setFocusEmulationEnabled', { enabled: true })
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })

const navigate = async (url) => {
  const loaded = new Promise((r) => { const l = (m) => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(l), 1); r() } }; listeners.push(l) })
  await send('Page.navigate', { url })
  await loaded
}
const waitFor = async (expression, timeout = 15000) => {
  const t0 = Date.now()
  for (;;) {
    if (await evaluate(`!!(${expression})`)) return
    if (Date.now() - t0 > timeout) throw new Error(`timeout waiting for ${expression}`)
    await sleep(100)
  }
}
let viewport = { width: 1280, height: 900 }
const shoot = async (file) => {
  // A taller page: the viewport is grown to the content's height for the shot (Chrome's captureBeyondViewport
  // shifts right-to-left pages sideways), then put back.
  const { cssContentSize } = await send('Page.getLayoutMetrics')
  const height = Math.min(4000, Math.ceil(cssContentSize.height))
  if (height > viewport.height) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height, deviceScaleFactor: 1, mobile: false })
    await sleep(150)
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(out, file), Buffer.from(shot.data, 'base64'))
  if (height > viewport.height) await send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false })
}
const centre = (selector) => evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)

const report = { base, captures: [], errors: {} }
for (const name of pages) {
  for (const theme of themes) for (const dir of dirs) for (const width of widths) {
    const tag = `${name}-${theme}-${dir}-${width}`
    errors.length = 0
    viewport = { width, height: width <= 400 ? 844 : 900 }
    await send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false })
    await navigate(`${base}/gallery.html?el=${encodeURIComponent(name)}&theme=${theme}&dir=${dir}`)
    await waitFor(`document.querySelector('[data-gallery-page] > :nth-child(2)')`)
    await evaluate(`(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'; document.head.appendChild(s); return document.fonts.ready.then(() => true) })()`)
    await sleep(300)
    await shoot(`${tag}.png`)
    report.captures.push(`${tag}.png`)
    // A page wider than the viewport is a layout fault of the element (it would scroll sideways on a phone).
    const overflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    if (overflow > 0) (report.overflow ??= {})[tag] = overflow
    const hover = await centre('[aria-description="gallery-hover"]')
    if (hover) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hover.x, y: hover.y })
      await sleep(150)
      await shoot(`${tag}-hover.png`)
      report.captures.push(`${tag}-hover.png`)
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 })
    }
    const click = await centre('[aria-description="gallery-click"]')
    if (click) {
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: click.x, y: click.y, button: 'left', clickCount: 1 })
      await sleep(300)
      await shoot(`${tag}-open.png`)
      report.captures.push(`${tag}-open.png`)
    }
    if (errors.length) report.errors[tag] = [...errors]
  }
  console.log(`${name}: ${themes.length * dirs.length * widths.length} states`)
}

writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 1))
await send('Browser.close').catch(() => {})
ws.close()
server.close()
setTimeout(() => { try { chrome.kill() } catch { /* already gone */ } try { rmSync(profile, { recursive: true, force: true }) } catch { /* Chrome still releasing files */ } process.exit(0) }, 500)
console.log(`${report.captures.length} captures in ${out}; pages with console errors: ${Object.keys(report.errors).length}`)
