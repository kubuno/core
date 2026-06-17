import { chromium } from 'playwright'

const browser = await chromium.connectOverCDP('http://localhost:9333')
const ctx = browser.contexts()[0]
const page = await ctx.newPage()
await page.setViewportSize({ width: 1600, height: 1000 })
page.setDefaultNavigationTimeout(60000); page.setDefaultTimeout(20000)
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

async function ensureLoggedIn() {
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(1200)
    if (!/\/login/.test(page.url()) && await page.locator('input[type=password]').count() === 0) return
    await page.locator('input[autocomplete="username"], input[type=text]').first().fill('admin@kubuno.local').catch(()=>{})
    await page.locator('input[type=password]').first().fill('Admin1234!').catch(()=>{})
    await page.keyboard.press('Enter'); await page.waitForTimeout(2000)
  }
}

try {
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'commit' })
  await ensureLoggedIn()
  await page.goto('http://127.0.0.1:8080/paintsharp/vertex', { waitUntil: 'commit' })
  await ensureLoggedIn(); await page.waitForTimeout(1500)

  let createBtn = page.locator('button').filter({ hasText: /New scene|Nouvelle scène/i }).first()
  await createBtn.click({ timeout: 5000 }).catch(async () => {
    await page.locator('button').filter({ hasText: /^Create$|Créer/i }).first().click().catch(()=>{})
    await page.waitForTimeout(500)
    await page.locator('text=/New 3D scene|scène 3D/i').first().click().catch(()=>{})
  })
  await page.waitForTimeout(3500)
  console.log('url:', page.url())

  const canvas = page.locator('canvas').first()
  await canvas.waitFor({ timeout: 10000 })
  await page.waitForTimeout(2500)
  const box = await canvas.boundingBox()
  const cx = box.x + box.width/2, cy = box.y + box.height/2

  // Select the object first (object mode click), then enter Edit Mode.
  await page.mouse.click(cx, cy); await page.waitForTimeout(400)
  await page.keyboard.press('2')   // Edit Mode
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'edit_1_vertexmode.png' })

  // Vertex select: click on the sphere → expect an orange selected point.
  await page.mouse.click(cx, cy); await page.waitForTimeout(500)
  await page.screenshot({ path: 'edit_2_vertex_selected.png' })

  // Edge select.
  await page.keyboard.press('2'); await page.waitForTimeout(300)
  await page.mouse.click(cx, cy); await page.waitForTimeout(500)
  await page.screenshot({ path: 'edit_3_edge_selected.png' })

  // Face select.
  await page.keyboard.press('3'); await page.waitForTimeout(300)
  await page.mouse.click(cx, cy); await page.waitForTimeout(500)
  await page.screenshot({ path: 'edit_4_face_selected.png' })

  // Grab: drag the selected face vertices and confirm it moves (screenshot).
  await page.mouse.move(cx, cy); await page.mouse.down()
  await page.mouse.move(cx + 80, cy - 60, { steps: 10 }); await page.mouse.up()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'edit_5_grabbed.png' })

  const webglErr = errors.filter(e => /WebGL/i.test(e)).length
  console.log('webgl errors:', webglErr)
  console.log('other errors:', JSON.stringify(errors.filter(e => !/WebGL/i.test(e)).slice(0,6), null, 2))
} catch (e) {
  console.log('TEST ERROR:', e.message)
  await page.screenshot({ path: 'edit_err.png' }).catch(()=>{})
  console.log('errors:', JSON.stringify(errors.slice(0,6), null, 2))
} finally {
  await page.close(); await browser.close()
}
