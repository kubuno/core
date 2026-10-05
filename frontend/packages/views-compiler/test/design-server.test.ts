/**
 * The design surface's dev-server route (`/__kubuno_design__/`): a real Vite dev server on a temporary project
 * serves the page, `project.json` (registries read like `ViewProject` reads them), the themes folder (and nothing
 * outside it), and announces itself in `.kubuno/design-server.json` while it listens.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createServer } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'

import { DESIGN_SERVER_FILE, designEntryUrl, themeFile } from '../src/design-server.js'
import { kbview } from '../src/vite.js'
import { UI_REGISTRY } from './paths.js'

const temp: string[] = []
afterAll(() => {
  for (const d of temp) rmSync(d, { recursive: true, force: true })
})

function project(): string {
  const root = mkdtempSync(join(tmpdir(), 'kbview-design-'))
  temp.push(root)
  mkdirSync(join(root, 'src'))
  mkdirSync(join(root, 'themes', 'light'), { recursive: true })
  writeFileSync(join(root, 'package.json'), '{"name":"design-fixture","private":true,"type":"module"}')
  writeFileSync(join(root, 'kubuno.views.json'), JSON.stringify({
    hostRegistry: UI_REGISTRY,
    registries: ['src/controls.json'],
    design: { entry: 'src/design/entry.tsx', themes: 'themes' },
  }))
  writeFileSync(join(root, 'src', 'controls.json'), JSON.stringify({
    schema: 1, target: 'web', components: [{ name: 'Fancy', children: 'None', allowed_children: [], properties: [], events: [], web: { module: './widgets/Fancy', export: 'Fancy' } }],
  }))
  writeFileSync(join(root, 'src', 'Card.kbcontrol'), '<UserControl/>\n')
  writeFileSync(join(root, 'src', 'Card.ts'), 'export {}\n')
  writeFileSync(join(root, 'themes', 'light', 'theme.json'), '{"id":"light","vars":{}}')
  writeFileSync(join(root, 'themes', 'light', 'global.css'), ':root{}')
  writeFileSync(join(root, 'themes', 'light', 'global.js'), 'export function register() {}')
  writeFileSync(join(root, 'secret.json'), '{"secret":true}')
  return root
}

describe('the design route', () => {
  it('maps design entries to page URLs and only serves theme files inside the folder', () => {
    expect(designEntryUrl('src/views/design/entry.tsx')).toBe('/src/views/design/entry.tsx')
    expect(designEntryUrl('src\\views\\design\\entry.tsx')).toBe('/src/views/design/entry.tsx')
    expect(designEntryUrl(undefined)).toBe('/@id/@kubuno/host-runtime/entry')
    const root = project()
    const themes = join(root, 'themes')
    expect(themeFile(themes, 'light/theme.json')).toBe(join(themes, 'light', 'theme.json'))
    expect(themeFile(themes, '../secret.json')).toBeNull()
    expect(themeFile(themes, '..%2Fsecret.json')).toBeNull()
    expect(themeFile(themes, 'light/global.js')).toBeNull()
    expect(themeFile(themes, 'light/missing.css')).toBeNull()
  })

  it('serves the page and project.json, announces itself while listening', async () => {
    const root = project()
    const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [kbview()], server: { host: '127.0.0.1', port: 5381 } })
    await server.listen()
    try {
      const announced = JSON.parse(readFileSync(join(root, DESIGN_SERVER_FILE), 'utf8'))
      expect(announced).toMatchObject({ version: 1, designPath: '/__kubuno_design__/', pid: process.pid })
      const base = announced.urls[0] as string
      expect(base).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/)

      const redirect = await fetch(`${base}__kubuno_design__`, { redirect: 'manual' })
      expect(redirect.status).toBe(302)
      const html = await (await fetch(`${base}__kubuno_design__/`)).text()
      expect(html).toContain('<script type="module" src="/src/design/entry.tsx"></script>')
      expect(html).toContain('/@vite/client')

      const info = await (await fetch(`${base}__kubuno_design__/project.json`)).json()
      expect(info.viewsAbi).toBe(1)
      expect(info.userControls).toEqual([{ name: 'Card', module: '/src/Card' }])
      expect(info.registries.map((r: { path: string }) => r.path)).toEqual(['src/controls.json'])
      expect(JSON.parse(info.registries[0].text).components[0].web.module).toBe('/src/widgets/Fancy')
      expect(JSON.parse(info.hostRegistry).target).toBe('web')
      expect(info.themes).toEqual(['light'])

      expect((await fetch(`${base}__kubuno_design__/themes/light/theme.json`)).status).toBe(200)
      expect((await fetch(`${base}__kubuno_design__/themes/light/global.js`)).status).toBe(404)
      expect((await fetch(`${base}__kubuno_design__/themes/..%2F..%2Fsecret.json`)).status).toBe(404)
    } finally {
      await server.close()
    }
    expect(existsSync(join(root, DESIGN_SERVER_FILE))).toBe(false)
  })
})
