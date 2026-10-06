#!/usr/bin/env node
// Keyboard and accessibility check of the list elements (WV-5b) in headless Chrome, on the gallery build: for each
// list page it focuses the list marked AccessibleDescription="gallery-list" (or "gallery-biglist" / "gallery-tiles"),
// sends real key events (CDP Input.dispatchKeyEvent) and asserts the focus, the selection, the expansion and the
// accessibility tree (Accessibility.getFullAXTree: roles and states). Its own Chrome profile and port, one tab,
// Chrome quit at the end. Prints a pass / fail table; exit 1 on a failure.
//
//   npx vite build --config vite.gallery.config.ts && node scripts/verify-lists.mjs [--port 9352]
import { spawn } from 'node:child_process'
import { createReadStream, existsSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fe = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback }
const dist = resolve(fe, arg('--dist', 'dist-gallery'))
const port = Number(arg('--port', '9352'))
const chromePath = arg('--chrome', process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome')
if (!existsSync(join(dist, 'gallery.html'))) throw new Error(`no gallery build in ${dist}`)

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer((req, res) => {
  const file = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

const profile = join(tmpdir(), `kbview-verify-lists-${process.pid}`)
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let version = null
for (let i = 0; i < 100 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json() } catch { await sleep(200) } }
if (!version) throw new Error('chrome did not start')
const tab = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pending = new Map()
const listeners = []
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
  else if (m.method) for (const l of listeners) l(m)
})
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
  return r.result.value
}
await send('Page.enable')
await send('Runtime.enable')
await send('Accessibility.enable')
// A headless tab is never the focused window: without this, focus() fires no focus event (React's onFocus).
await send('Emulation.setFocusEmulationEnabled', { enabled: true })

const open = async (page, dir = 'ltr') => {
  const loaded = new Promise((r) => { const l = (m) => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(l), 1); r() } }; listeners.push(l) })
  await send('Page.navigate', { url: `${base}/gallery.html?el=${page}&dir=${dir}` })
  await loaded
  for (let i = 0; i < 100; i++) { if (await evaluate(`!!document.querySelector('[aria-description^="gallery-"]')`)) break; await sleep(100) }
  await sleep(200)
}
const KEYS = { ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35, PageDown: 34, PageUp: 33, Enter: 13, ' ': 32 }
const key = async (k, mods = 0) => {
  const code = k === ' ' ? 'Space' : k.length === 1 ? `Key${k.toUpperCase()}` : k
  const text = k === 'Enter' ? '\r' : k.length === 1 ? k : undefined
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, modifiers: mods, windowsVirtualKeyCode: KEYS[k] ?? k.toUpperCase().charCodeAt(0), ...(text ? { text } : {}) })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, modifiers: mods, windowsVirtualKeyCode: KEYS[k] ?? k.toUpperCase().charCodeAt(0) })
  await sleep(60)
}
const SHIFT = 8
const focus = async (marker) => { const ok = await evaluate(`(() => { const e = document.querySelector('[aria-description="${marker}"]'); e.focus(); return document.activeElement === e })()`); await sleep(80); return ok }
/** The focused list's active descendant: its text and states. */
const activeRow = (marker) => evaluate(`(() => { const l = document.querySelector('[aria-description="${marker}"]'); const id = l.getAttribute('aria-activedescendant'); const r = id && document.getElementById(id); return r ? { text: r.textContent, selected: r.getAttribute('aria-selected'), checked: r.getAttribute('aria-checked'), expanded: r.getAttribute('aria-expanded'), level: r.getAttribute('aria-level') } : null })()`)
const pageText = () => evaluate('document.body.innerText')
const rendered = (marker, role) => evaluate(`document.querySelectorAll('[aria-description="${marker}"] [role="${role}"]').length`)
/** Roles and states of the accessibility tree under a list. */
const axOf = async (marker) => {
  const doc = await send('DOM.getDocument', { depth: 0 })
  const q = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `[aria-description="${marker}"]` })
  const d = await send('DOM.describeNode', { nodeId: q.nodeId })
  const { nodes } = await send('Accessibility.getFullAXTree')
  const byId = new Map(nodes.map((n) => [n.nodeId, n]))
  const root = nodes.find((n) => n.backendDOMNodeId === d.node.backendNodeId)
  const out = []
  const walk = (n) => {
    if (!n.ignored && ['listbox', 'option', 'tree', 'treeitem', 'grid', 'row', 'columnheader', 'gridcell'].includes(n.role?.value)) {
      const p = Object.fromEntries((n.properties ?? []).filter((x) => ['selected', 'checked', 'expanded', 'level', 'multiselectable', 'focusable'].includes(x.name)).map((x) => [x.name, x.value?.value]))
      out.push({ role: n.role.value, name: n.name?.value ?? '', ...p })
    }
    for (const c of n.childIds ?? []) { const k = byId.get(c); if (k) walk(k) }
  }
  if (root) walk(root)
  return out
}

const results = []
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: ok ? '' : detail })

// ── ListBox ──
await open('ListBox')
check('ListBox: focusable listbox', await focus('gallery-list'))
await key('ArrowDown')
let a = await activeRow('gallery-list')
check('ListBox: ArrowDown selects the next item', a?.text === 'Citron' && a.selected === 'true', JSON.stringify(a))
check('ListBox: two-way SelectedIndex follows', (await pageText()).includes('SelectedIndex = 3'))
await key('Home'); a = await activeRow('gallery-list')
check('ListBox: Home', a?.text === 'Abricot', JSON.stringify(a))
await key('End'); a = await activeRow('gallery-list')
check('ListBox: End', a?.text === 'Pomme', JSON.stringify(a))
await key('r'); a = await activeRow('gallery-list')
check('ListBox: type-ahead', a?.text === 'Raisin', JSON.stringify(a))
let ax = await axOf('gallery-list')
check('ListBox: AX listbox with options, one selected', ax[0]?.role === 'listbox' && ax.filter((x) => x.role === 'option').length === 6 && ax.filter((x) => x.selected === true).length === 1, JSON.stringify(ax.slice(0, 3)))
check('ListBox (10 000 rows): only a window is rendered', (await rendered('gallery-biglist', 'option')) < 60, String(await rendered('gallery-biglist', 'option')))
await focus('gallery-biglist')
await key('ArrowDown'); await key('ArrowDown', SHIFT); await key('ArrowDown', SHIFT)
ax = await axOf('gallery-biglist')
check('ListBox MultiExtended: Shift+ArrowDown extends', ax[0]?.multiselectable === true && ax.filter((x) => x.selected === true).length === 3, JSON.stringify(ax.filter((x) => x.selected === true)))
await key('PageDown'); await key('End'); a = await activeRow('gallery-biglist')
check('ListBox (10 000 rows): End reaches the last row (scrolled in)', a?.text === 'Ligne 10000', JSON.stringify(a))
check('ListBox: SelectedValue two-way', (await pageText()).includes('SelectedValue = row-10000'))

// ── CheckedListBox ──
await open('CheckedListBox')
await focus('gallery-list')
await key(' ')
a = await activeRow('gallery-list')
check('CheckedListBox: Space checks the item', a?.text === 'Courriels' && a.checked === 'true', JSON.stringify(a))
check('CheckedListBox: two-way Item Checked and OnCheckedChanged', (await pageText()).includes('Courriels: oui · item 0 checked'))
await key('ArrowDown'); await key(' ')
ax = await axOf('gallery-list')
check('CheckedListBox: AX options carry checked', ax.filter((x) => x.role === 'option').map((x) => x.checked).join(',') === 'true,false,false,true', JSON.stringify(ax.map((x) => x.checked)))

// ── TreeView ──
for (const dir of ['ltr', 'rtl']) {
  await open('TreeView', dir)
  const inward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const outward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  await focus('gallery-list')
  a = await activeRow('gallery-list')
  check(`TreeView ${dir}: the bound SelectedPath is the active item`, a?.text === 'Contrats' && a.level === '3', JSON.stringify(a))
  await key(outward); a = await activeRow('gallery-list')
  check(`TreeView ${dir}: ${outward} goes to the parent`, a?.text === 'Documents' && a.expanded === 'true', JSON.stringify(a))
  await key(outward); a = await activeRow('gallery-list')
  check(`TreeView ${dir}: ${outward} collapses`, a?.text === 'Documents' && a.expanded === 'false', JSON.stringify(a))
  await key(inward); a = await activeRow('gallery-list')
  check(`TreeView ${dir}: ${inward} expands`, a?.expanded === 'true', JSON.stringify(a))
  await key(inward); a = await activeRow('gallery-list')
  check(`TreeView ${dir}: ${inward} enters the first child`, a?.text === 'Factures', JSON.stringify(a))
  check(`TreeView ${dir}: two-way SelectedPath`, (await pageText()).includes('SelectedPath = 0.0.0'))
  await key('Enter')
  check(`TreeView ${dir}: Enter activates`, (await pageText()).includes('activated: Factures'))
}
ax = await axOf('gallery-list')
check('TreeView: AX tree, treeitems with level / expanded / selected', ax[0]?.role === 'tree' && ax.some((x) => x.role === 'treeitem' && x.level === 3 && x.selected === true) && ax.some((x) => x.expanded === true), JSON.stringify(ax.slice(0, 4)))
check('TreeView (10 000 rows): only a window is rendered', (await rendered('gallery-biglist', 'treeitem')) < 60, String(await rendered('gallery-biglist', 'treeitem')))

// ── ListView ──
await open('ListView')
await focus('gallery-list')
await key('ArrowDown'); await key('ArrowDown', SHIFT)
ax = await axOf('gallery-list')
check('ListView Details: AX grid, headers, two rows selected', ax[0]?.role === 'grid' && ax.filter((x) => x.role === 'columnheader').length === 3 && ax.filter((x) => x.role === 'row' && x.selected === true).length === 2, JSON.stringify(ax.filter((x) => x.selected === true).map((x) => x.name)))
await key('Enter')
check('ListView: Enter activates the row', (await pageText()).includes('activated: Document 0003.pdf'))
check('ListView (2 000 rows): only a window is rendered', (await rendered('gallery-list', 'row')) < 60, String(await rendered('gallery-list', 'row')))
await focus('gallery-tiles')
await key('ArrowRight'); a = await activeRow('gallery-tiles')
check('ListView LargeIcon: ArrowRight moves along the tiles', a?.text === 'Agenda', JSON.stringify(a))
await key('ArrowDown'); a = await activeRow('gallery-tiles')
check('ListView LargeIcon: ArrowDown moves a row of tiles down', a?.text === 'Tâches', JSON.stringify(a))

// ── DataTable ──
await open('DataTable')
const firstRow = await evaluate(`(() => { const r = document.querySelector('[aria-description="gallery-table"] tbody tr[tabindex="0"]'); r?.focus(); return r ? document.activeElement === r : false })()`)
check('DataTable: the selected row takes the focus (roving)', firstRow)
await key('ArrowDown')
check('DataTable: ArrowDown selects the next row (two-way SelectedIndex)', (await pageText()).includes('SelectedIndex = 2'))
await key('Enter')
check('DataTable: Enter raises OnRowActivated', (await pageText()).includes('activated: Lucas Bernard'))
const sel = await evaluate(`document.querySelector('[aria-description="gallery-table"] tbody tr[aria-selected="true"]')?.textContent ?? ''`)
check('DataTable: aria-selected on the selected row', sel.startsWith('Lucas Bernard'), sel)

await send('Browser.close').catch(() => {})
ws.close()
server.close()
const width = Math.max(...results.map((r) => r.name.length))
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(width)}  ${r.detail}`)
const failed = results.filter((r) => !r.ok).length
console.log(`${results.length - failed}/${results.length} passed`)
setTimeout(() => { try { chrome.kill() } catch { /* gone */ } try { rmSync(profile, { recursive: true, force: true }) } catch { /* busy */ } process.exit(failed ? 1 : 0) }, 500)
