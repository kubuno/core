import { chromium } from 'playwright'
const b = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = b.contexts()[0].pages().find(p => p.url().includes('/admin')) ?? b.contexts()[0].pages()[0]
await page.bringToFront()
await page.goto('http://localhost:8080/admin?tab=settings', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const out = await page.evaluate(async () => {
  const canvas = [...document.querySelectorAll('canvas')].find(c => c.width === 36)
  const input = canvas.parentElement.querySelector('input[type=checkbox]')
  const label = canvas.closest('div')?.parentElement?.innerText?.slice(0, 60).replace(/\n/g, ' / ')
  const before = input.checked
  const ev = []
  let t0 = 0
  const origRR = CanvasRenderingContext2D.prototype.roundRect
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w) {
    if (this.canvas === canvas && w === 14)
      ev.push({ t: +(performance.now() - t0).toFixed(0), x: +x.toFixed(2), dom: input.checked })
    return origRR.apply(this, arguments)
  }
  const origFetch = window.fetch
  window.fetch = function (...a) {
    const u = String(a[0]), m = a[1]?.method ?? 'GET'
    if (u.includes('/admin/settings')) {
      ev.push({ t: +(performance.now() - t0).toFixed(0), net: `${m} ->` })
      return origFetch.apply(this, a).then(r => { ev.push({ t: +(performance.now() - t0).toFixed(0), net: `${m} <- ${r.status}` }); return r })
    }
    return origFetch.apply(this, a)
  }

  const runs = []
  for (let i = 0; i < 2; i++) {
    ev.length = 0; t0 = performance.now()
    input.click()                                   // vrai clic : React + mutation serveur
    await new Promise(r => setTimeout(r, 1500))
    runs.push(ev.slice())
  }
  CanvasRenderingContext2D.prototype.roundRect = origRR
  window.fetch = origFetch
  return { label, before, after: input.checked, runs }
})

console.log('réglage testé :', out.label)
console.log('valeur avant :', out.before, '| valeur après les 2 clics :', out.after,
            out.before === out.after ? '  ✅ restaurée' : '  ⚠️ MODIFIÉE')
out.runs.forEach((r, i) => {
  console.log(`\n=== clic ${i + 1} ===`)
  let prev = null
  for (const e of r) {
    if (e.net) { console.log(`${String(e.t).padStart(5)}ms   ${e.net}`); continue }
    const dir = prev === null ? '' : e.x > prev + 0.01 ? '→' : e.x < prev - 0.01 ? '←' : '·'
    console.log(`${String(e.t).padStart(5)}ms   x=${e.x.toFixed(2).padStart(5)}  ${dir}   (input.checked=${e.dom})`)
    prev = e.x
  }
})
await b.close()
