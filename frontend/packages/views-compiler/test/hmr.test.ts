/**
 * HMR in a real browser: the fixture app (a counter view in React StrictMode) runs on the Vite dev server
 * with the kbview plugin; headless Chrome clicks, then the test edits the `.kbview` and the code-behind on
 * disk and checks that the page updates WITHOUT a reload and WITHOUT losing the view's state.
 *
 * Chrome: KBVIEW_CHROME, else the usual install path of the OS; skipped when none is found.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import react from '@vitejs/plugin-react'
import { chromium, type Browser, type Page } from 'playwright-core'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { kbview } from '../src/vite.js'
import { FIXTURES, VIEWS_SRC } from './paths.js'

const APP = join(FIXTURES, 'app')
const VIEW = join(APP, 'src', 'Counter.kbview')
const CODE = join(APP, 'src', 'Counter.ts')

function chromePath(): string | undefined {
  const candidates = [
    process.env.KBVIEW_CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  return candidates.find((c): c is string => !!c && existsSync(c))
}

const chrome = chromePath()
const originals = new Map<string, string>()
let server: ViteDevServer | undefined
let browser: Browser | undefined
let page: Page

function edit(file: string, change: (text: string) => string): void {
  if (!originals.has(file)) originals.set(file, readFileSync(file, 'utf8'))
  writeFileSync(file, change(readFileSync(file, 'utf8')))
}

async function badgeText(): Promise<string> {
  return (await page.locator('.badge').first().textContent()) ?? ''
}

describe.skipIf(!chrome)('HMR (Vite dev server + Chrome)', () => {
  beforeAll(async () => {
    server = await createServer({
      root: APP,
      configFile: false,
      logLevel: 'error',
      plugins: [kbview(), react()],
      resolve: { alias: { '@kubuno/views': VIEWS_SRC, '@ui': join(APP, 'src', 'fake-ui.ts') } },
      server: { port: 0, host: '127.0.0.1', fs: { strict: false } },
      optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@tanstack/react-query'] },
    })
    await server.listen()
    const address = server.httpServer?.address()
    const port = typeof address === 'object' && address ? address.port : 0
    browser = await chromium.launch({ executablePath: chrome, headless: true })
    page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`http://127.0.0.1:${port}/`)
    await page.getByRole('button', { name: 'Clicks' }).waitFor({ timeout: 60_000 })
    expect(errors).toEqual([])
  })

  afterAll(async () => {
    for (const [file, text] of originals) writeFileSync(file, text)
    await browser?.close()
    await server?.close()
  })

  it('keeps the state across a .kbview edit and a code-behind edit, without reloading', async () => {
    const button = page.getByRole('button', { name: 'Clicks' })
    await button.click()
    await button.click()
    await expect.poll(badgeText).toBe('2')
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 42))
    // StrictMode mounted the view twice in development: OnLoad ran on each mount, and the state is one.
    const loads = await page.evaluate(() => document.querySelectorAll('button').length)
    expect(loads).toBe(1)

    // 1. Edit the view: a new element appears, the counter keeps its value.
    edit(VIEW, (t) => t.replace('</Stack>', '  <Badge Text="from-hmr"/>\n</Stack>'))
    await page.getByText('from-hmr').waitFor({ timeout: 30_000 })
    expect(await badgeText()).toBe('2')

    // 2. Edit the code-behind: the new method runs on the live instance (prototype swap).
    edit(CODE, (t) => t.replace('this.count = this.count + 1', 'this.count = this.count + 10'))
    await expect
      .poll(async () => {
        await page.getByRole('button', { name: 'Clicks' }).click()
        return Number(await badgeText())
      }, { timeout: 30_000, interval: 1000 })
      .toBeGreaterThanOrEqual(12)
    const value = Number(await badgeText())
    expect((value - 2) % 10 === 0 || (value - 3) % 10 === 0).toBe(true)

    // 3. A view that does not compile: the overlay shows file/line, the last good view stays.
    edit(VIEW, (t) => t.replace('<Badge Text="from-hmr"/>', '<Bdge Text="from-hmr"/>'))
    await page.locator('vite-error-overlay').waitFor({ state: 'attached', timeout: 30_000 })
    const overlay = await page.locator('vite-error-overlay').evaluate((el) => el.shadowRoot?.textContent ?? '')
    expect(overlay).toMatch(/Counter\.kbview\(4,4\): error KBV-unknown-element/)
    expect(await page.locator('.badge', { hasText: 'from-hmr' }).count()).toBe(1)

    // 4. Fixed again: the page recovers, still without a reload.
    edit(VIEW, (t) => t.replace('<Bdge Text="from-hmr"/>', '<Badge Text="fixed-hmr"/>'))
    await page.locator('.badge', { hasText: 'fixed-hmr' }).waitFor({ timeout: 30_000 })
    expect(Number(await badgeText())).toBe(value)
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(42)
  })
})
