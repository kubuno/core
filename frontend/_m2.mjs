import { chromium } from 'playwright'
const b = await chromium.connectOverCDP('http://localhost:9222').catch(()=>null)
const ctx = await chromium.launchPersistentContext('/tmp/chrome-swgl', {
  headless:true, executablePath:'/opt/google/chrome/chrome', viewport:{width:1500,height:920},
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
})
const page = ctx.pages()[0] || await ctx.newPage()
await page.goto('https://dev.kubuno.com/',{waitUntil:'networkidle'})
await page.waitForTimeout(2000)
const data = await page.evaluate(()=>{
  const all=[...document.querySelectorAll('header button, [class*=topbar] button, button')].filter(b=>b.querySelector('svg.lucide-globe,svg.lucide-bell,svg.lucide-settings,svg.lucide-circle-help,svg.lucide-layout-grid'))
  return all.map(b=>{const r=b.getBoundingClientRect();const ic=[...b.querySelectorAll('svg')].map(s=>s.getAttribute('class')).join();return {ic:ic.match(/lucide-[a-z-]+/g)?.pop(), w:Math.round(r.width), h:Math.round(r.height), top:Math.round(r.top)}})
})
console.log(JSON.stringify(data))
await ctx.close()
