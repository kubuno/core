import { chromium } from 'playwright'
const DOC='a0d31c42-67ce-4601-9a59-f2c1f3b1fc9f'
const b=await chromium.connectOverCDP('http://localhost:9222')
const ctx=b.contexts()[0]; let page=ctx.pages()[0]; await page.bringToFront()
const log=(...a)=>console.log('[bm]',...a)
await page.goto(`http://localhost:8080/office/${DOC}`); await page.waitForTimeout(2000)
if(page.url().includes('/login')){await page.fill('input[autocomplete="username"]','admin@kubuno.local');await page.fill('input[autocomplete="current-password"]','Admin1234!');await page.click('button:has-text("Se connecter")');await page.waitForTimeout(3000);await page.goto(`http://localhost:8080/office/${DOC}`)}
await page.evaluate(()=>location.reload(true)); await page.waitForTimeout(4200)
// "u document." line is body text near top — viewport ~ y292. Double-click the word "document".
await page.mouse.dblclick(800, 292); await page.waitForTimeout(800)
let bar=await page.evaluate(()=>{
  const bars=[...document.querySelectorAll('div')].filter(d=>getComputedStyle(d).position==='fixed'&&d.className.includes('flex-col')&&d.className.includes('shadow-lg'))
  if(!bars.length) return null
  const r=bars[0].getBoundingClientRect()
  return {btns:bars[0].querySelectorAll('button').length, y:Math.round(r.y), x:Math.round(r.x), text:bars[0].innerText.replace(/\n/g,'|').slice(0,30)}
})
log('after dblclick "document":',JSON.stringify(bar))
await page.screenshot({path:'/tmp/body_mini.png'})
await b.close(); log('DONE')
