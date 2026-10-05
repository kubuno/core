#!/usr/bin/env node
// Keyboard and ARIA checks of the WV-5b navigation elements, on the element gallery (vite.gallery.config.ts) in
// headless Chrome: Toolbar (roving tab stop), Splitter (separator keys), Popover (open, Escape, focus back),
// SearchField (typing, Enter, Escape), MaskedField (typing through the mask), Sidebar (aria-current, Space).
// Its own Chrome profile and debugging port, one tab, Chrome quit at the end. Prints a pass / fail table; exit 1
// on a failure.
//
//   npx vite build --config vite.gallery.config.ts && node scripts/verify-nav.mjs [--port 9362]
import { spawn } from 'node:child_process'
import { createReadStream, existsSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fe = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback }
const dist = resolve(fe, arg('--dist', 'dist-gallery'))
const chromePath = arg('--chrome', process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome')
const debugPort = Number(arg('--port', '9362'))
if (!existsSync(join(dist, 'gallery.html'))) throw new Error(`no gallery build in ${dist}`)

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = join(dist, path === '/' ? 'gallery.html' : path)
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

const profile = join(tmpdir(), `kbview-verify-nav-${process.pid}`)
rmSync(profile, { recursive: true, force: true })
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let version = null
for (let i = 0; i < 100 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json() } catch { await sleep(200) } }
if (!version) throw new Error('chrome did not start')
const tab = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find((t) => t.type === 'page')
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pending = new Map()
const listeners = []
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) } else if (m.method) for (const l of listeners) l(m)
})
const send = (method, params = {}) => new Promise((ok, reject) => { const id = ++seq; pending.set(id, { resolve: ok, reject }); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`)
  return r.result.value
}
await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

const open = async (page, dir = 'ltr') => {
  const loaded = new Promise((r) => { const l = (m) => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(l), 1); r() } }; listeners.push(l) })
  await send('Page.navigate', { url: `${base}/gallery.html?el=${page}&dir=${dir}` })
  await loaded
  for (let i = 0; i < 100 && !(await evaluate(`!!document.querySelector('[data-gallery-page] > :nth-child(2)')`)); i++) await sleep(100)
  await sleep(200)
}
const KEYS = { Enter: 13, Escape: 27, ' ': 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, Tab: 9 }
const key = async (k, modifiers = 0) => {
  const text = k === 'Enter' ? '\r' : k === ' ' ? ' ' : undefined
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k === ' ' ? 'Space' : k, windowsVirtualKeyCode: KEYS[k] ?? 0, modifiers, ...(text ? { text } : {}) })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k === ' ' ? 'Space' : k, windowsVirtualKeyCode: KEYS[k] ?? 0, modifiers })
  await sleep(80)
}
const type = async (s) => { for (const c of s) { await send('Input.insertText', { text: c }); await sleep(30) } }
const active = () => evaluate(`(() => { const a = document.activeElement; return a ? (a.getAttribute('aria-label') || a.textContent || a.tagName).trim() : '' })()`)
const text = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`)
const status = () => evaluate(`[...document.querySelectorAll('[data-gallery-page] p')].map(p => p.textContent).join(' | ')`)

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); }

for (const dir of ['ltr', 'rtl']) {
  const S = dir === 'rtl' ? ' (rtl)' : ''
  // ── Toolbar ──
  await open('Toolbar', dir)
  check(`toolbar role${S}`, await evaluate(`document.querySelectorAll('[role=toolbar]').length === 2`))
  check(`toolbar one tab stop${S}`, await evaluate(`[...document.querySelector('[role=toolbar]').querySelectorAll('button')].filter(b => b.tabIndex === 0).length === 1`))
  await evaluate(`document.querySelector('[role=toolbar] button').focus(); true`)
  await key(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
  check(`toolbar arrow → next${S}`, (await active()) === 'Italic', await active())
  await key('End')
  check(`toolbar End → last enabled${S}`, (await active()) === 'Link', await active())
  await key(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
  check(`toolbar wraps past the disabled one${S}`, (await active()) === 'Bold', await active())
  await key('Enter')
  check(`toolbar Enter runs the command${S}`, (await status()).includes('Command #0'), await status())

  // ── Splitter ──
  await open('Splitter', dir)
  await evaluate(`document.querySelector('[role=separator]').focus(); true`)
  const v0 = Number(await evaluate(`document.querySelector('[role=separator]').getAttribute('aria-valuenow')`))
  await key(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
  const v1 = Number(await evaluate(`document.querySelector('[role=separator]').getAttribute('aria-valuenow')`))
  check(`splitter arrow grows the first pane${S}`, v1 === v0 + 10, `${v0} → ${v1}`)
  await key(dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft', 8)
  const v2 = Number(await evaluate(`document.querySelector('[role=separator]').getAttribute('aria-valuenow')`))
  check(`splitter Shift+arrow by 50${S}`, v2 === v1 - 50, `${v1} → ${v2}`)
  check(`splitter two-way Distance${S}`, (await status()).includes(`${v2} px`), await status())
  check(`splitter aria-orientation${S}`, await evaluate(`document.querySelector('[role=separator]').getAttribute('aria-orientation') === 'vertical'`))

  // ── Popover ──
  await open('Popover', dir)
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Open below').focus(); true`)
  await key('Enter')
  await sleep(150)
  check(`popover opens${S}`, (await evaluate(`document.body.textContent.includes('Share the budget')`)) && (await status()).includes('opened'), await status())
  await key('Escape')
  await sleep(150)
  check(`popover Escape closes${S}`, !(await evaluate(`document.body.textContent.includes('Share the budget')`)) && (await status()).includes('closed'), await status())
  check(`popover focus back to the target${S}`, (await active()) === 'Open below', await active())

  // ── SearchField ──
  await open('SearchField', dir)
  await evaluate(`document.querySelector('[role=searchbox]').focus(); true`)
  await type('budget')
  check(`search typing (two-way)${S}`, (await status()).includes('Text: "budget"'), await status())
  await key('Enter')
  check(`search Enter → OnSearch${S}`, (await status()).includes('searched: "budget"'), await status())
  await key('Escape')
  check(`search Escape clears${S}`, (await evaluate(`document.querySelector('[role=searchbox]').value`)) === '', await evaluate(`document.querySelector('[role=searchbox]').value`))

  // ── MaskedField ──
  await open('MaskedField', dir)
  await evaluate(`document.querySelector('input[aria-label=Plate]').focus(); true`)
  await type('ab12x3cd')
  check(`masked typing through LL-000-LL${S}`, (await evaluate(`document.querySelector('input[aria-label=Plate]').value`)) === 'ab-123-cd', await evaluate(`document.querySelector('input[aria-label=Plate]').value`))
  await evaluate(`(() => { const i = document.querySelector('input[aria-label=Date]'); i.focus(); i.select(); return true })()`)
  await type('24122025')
  check(`masked date two-way${S}`, (await status()).includes('24/12/2025'), await status())
  check(`masked Invalid → aria-invalid${S}`, await evaluate(`document.querySelector('input[aria-label="Invalid date"]').getAttribute('aria-invalid') === 'true'`))

  // ── Sidebar ──
  await open('Sidebar', dir)
  check(`sidebar nav + aria-current${S}`, (await evaluate(`document.querySelector('nav[aria-label=Drive] [aria-current=page]')?.textContent`)) === 'Shared with me')
  await evaluate(`[...document.querySelectorAll('nav[aria-label=Drive] a')].find(a => a.textContent === 'Recent').focus(); true`)
  await key(' ')
  check(`sidebar Space chooses the row${S}`, (await evaluate(`document.querySelector('nav[aria-label=Drive] [aria-current=page]')?.textContent`)) === 'Recent' && (await status()).includes('invoked: recent'), await status())
  check(`sidebar rail follows SelectedItem${S}`, (await evaluate(`document.querySelector('nav[aria-label=Rail] [aria-current=page]')?.getAttribute('aria-label')`)) === 'Recent')
  await evaluate(`[...document.querySelectorAll('nav[aria-label=Drive] a')].find(a => a.textContent === 'Projects').click(); true`)
  check(`sidebar group folds (aria-expanded)${S}`, (await evaluate(`[...document.querySelectorAll('nav[aria-label=Drive] a')].find(a => a.textContent === 'Projects').getAttribute('aria-expanded')`)) === 'false')

  // ── StatusBar ──
  await open('StatusBar', dir)
  check(`status bar role=status${S}`, await evaluate(`!!document.querySelector('[role=status][aria-label="Editor status"]')`))
  await evaluate(`[...document.querySelectorAll('[role=status] button')].find(b => b.textContent === 'UTF-8').click(); true`)
  check(`status bar OnItemClicked index${S}`, (await status()).includes('Cell #4'), await status())
}

await send('Browser.close').catch(() => {})
ws.close()
server.close()
setTimeout(() => { try { chrome.kill() } catch { /* gone */ } rmSync(profile, { recursive: true, force: true }) }, 300)
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  [${r.detail}]`}`)
const failed = results.filter((r) => !r.ok).length
console.log(`${results.length - failed}/${results.length} passed`)
setTimeout(() => process.exit(failed ? 1 : 0), 400)
