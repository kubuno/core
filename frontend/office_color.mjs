import { chromium } from 'playwright'
const DOC='a0d31c42-67ce-4601-9a59-f2c1f3b1fc9f'
const b=await chromium.connectOverCDP('http://localhost:9222')
const ctx=b.contexts()[0]; let page=ctx.pages().find(p=>p.url().includes('/office/'))||ctx.pages()[0]; await page.bringToFront()
const log=(...a)=>console.log('[oc]',...a)
await page.goto(`http://localhost:8080/office/${DOC}`); await page.waitForTimeout(2500)
let body=await page.evaluate(()=>document.body.innerText.slice(0,40))
if(/RATE_LIMITED/.test(body)){log('limited');await page.waitForTimeout(30000);await page.goto(`http://localhost:8080/office/${DOC}`);await page.waitForTimeout(2500)}
if(page.url().includes('/login')){await page.fill('input[autocomplete="username"]','admin@kubuno.local');await page.fill('input[autocomplete="current-password"]','Admin1234!');await page.click('button:has-text("Se connecter")');await page.waitForTimeout(3000);await page.goto(`http://localhost:8080/office/${DOC}`)}
await page.evaluate(()=>location.reload(true)); await page.waitForTimeout(5000)
const tabs=await page.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>['Accueil','Insertion','Mise en page','Affichage'].includes(t)))
log('tabs:',JSON.stringify(tabs))
await page.screenshot({path:'/tmp/office_color.png'})
// crop the top region for clarity
await page.screenshot({path:'/tmp/office_color_top.png', clip:{x:0,y:0,width:1920,height:230}})
await b.close(); log('DONE')
