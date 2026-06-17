import { chromium } from 'playwright'
const b = await chromium.connectOverCDP('http://localhost:9222')
const ctx = b.contexts()[0]
let page = ctx.pages().find(p => p.url().includes('localhost:8080/app')) || ctx.pages().find(p=>p.url().includes('localhost:8080'))
await page.goto('http://localhost:8080/app', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.getByRole('button', { name: /New app|Nouvelle application/i }).first().click()
await page.waitForTimeout(800)
const kw = await page.getByText(/Web app|Application web/i).count()
const km = await page.getByText(/Mobile app|Application mobile/i).count()
console.error('MODAL web:', kw, 'mobile:', km)
await page.screenshot({ path: '/tmp/app_modal.png' })
// pick web then check templates
if (kw) {
  await page.getByText(/Web app|Application web/i).first().click()
  await page.waitForTimeout(600)
  const tpl = await page.getByText(/Liste de tâches|Vierge|Blank|To-?do/i).count()
  console.error('TEMPLATES visible:', tpl)
  await page.screenshot({ path: '/tmp/app_templates.png' })
}
