import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { build, type Rollup } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'

import { kbview } from '../src/vite.js'
import { FIXTURES, UI_REGISTRY } from './paths.js'

const APP = join(FIXTURES, 'app')
const temp: string[] = []

afterAll(() => {
  for (const d of temp) rmSync(d, { recursive: true, force: true })
})

/** Builds `entry` of `root` the way a module bundle is built: host singletons external. */
async function bundle(root: string, entry: string): Promise<Rollup.OutputChunk[]> {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [kbview()],
    build: {
      write: false,
      minify: false,
      sourcemap: true,
      lib: { entry, formats: ['es'], fileName: () => 'entry.js' },
      rollupOptions: { external: (id) => /^(react|react-dom|@ui$|@kubuno\/|lucide-react)/.test(id) },
    },
  })
  const outputs = Array.isArray(result) ? result : [result]
  return outputs.flatMap((o) => ('output' in o ? o.output : [])).filter((o): o is Rollup.OutputChunk => o.type === 'chunk')
}

describe('the Vite plugin', () => {
  it('bundles a view and its code-behind like a module build: host singletons external, accessors, lowered decorators', async () => {
    const [chunk] = await bundle(APP, join(APP, 'src', 'Counter.ts'))
    const code = chunk.code
    expect(code).toMatch(/from "@kubuno\/views"/)
    expect(code).toMatch(/from "@ui"/)
    expect(code).not.toMatch(/from "\.\.\//)
    expect(code).toContain('(o) => o.label')
    expect(code).toContain('(vm, s, e) => vm.inc_click(s, e)')
    // Standard decorators lowered (no `@bind accessor` left for the browser).
    expect(code).not.toMatch(/@bind\s+accessor/)
    // The view's source map reaches the .kbview.
    expect(chunk.map?.sources.some((s) => s.endsWith('Counter.kbview'))).toBe(true)
    // No HMR code in a production build.
    expect(code).not.toContain('import.meta.hot')
  })

  it('fails the build on a view error, with file, line and column', async () => {
    const root = mkdtempSync(join(tmpdir(), 'kbview-broken-'))
    temp.push(root)
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, 'package.json'), '{"name":"broken","private":true,"type":"module"}')
    writeFileSync(join(root, 'kubuno.views.json'), JSON.stringify({ hostRegistry: UI_REGISTRY }))
    writeFileSync(join(root, 'src', 'Broken.kbview'), '<Card>\n   <Buton Text="x"/>\n</Card>\n')
    await expect(bundle(root, join(root, 'src', 'Broken.kbview'))).rejects.toThrow(/src\/Broken\.kbview\(2,5\): error KBV-unknown-element: unknown element `Buton` on the web target; did you mean `Button`\?/)
  })

  it('compiles a .kbres set to i18next bundles and {Res} arguments to accessors (WV-6)', async () => {
    const root = mkdtempSync(join(tmpdir(), 'kbview-kbres-'))
    temp.push(root)
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, 'package.json'), '{"name":"kbres","private":true,"type":"module"}')
    writeFileSync(join(root, 'kubuno.views.json'), JSON.stringify({ hostRegistry: UI_REGISTRY }))
    const kbres = (culture: string | null, entries: Record<string, string>) =>
      `<?xml version="1.0" encoding="utf-8"?>\n<Resources Version="1"${culture ? ` Culture="${culture}"` : ''}>\n${Object.entries(entries).map(([k, v]) => `  <String Name="${k}">${v}</String>`).join('\n')}\n</Resources>\n`
    writeFileSync(join(root, 'src', 'strings.kbres'), kbres('en', { 'files.count_one': '{{count}} file', 'files.count_other': '{{count}} files', title: 'Files' }))
    writeFileSync(join(root, 'src', 'strings.fr.kbres'), kbres(null, { 'files.count_one': '{{count}} fichier', 'files.count_many': '{{count}} de fichiers', 'files.count_other': '{{count}} fichiers' }))
    writeFileSync(join(root, 'src', 'strings.ar.kbres'), kbres(null, { title: 'الملفات' }))
    writeFileSync(join(root, 'src', 'Files.kbview'), '<Stack>\n  <Label Text="{Res files.count, Count={Binding n}, Who=Kim}"/>\n  <Label Text="{Res title}"/>\n</Stack>\n')
    writeFileSync(join(root, 'src', 'main.ts'), "import strings from './strings.kbres'\nimport Files from './Files.kbview'\nexport { strings, Files }\n")
    const [chunk] = await bundle(root, join(root, 'src', 'main.ts'))
    const code = chunk.code
    const squeeze = (s: string) => s.replace(/\s+/g, '')
    const flat = squeeze(code)
    // The set: one nested bundle per language, the neutral file as its Culture.
    expect(flat).toContain(squeeze('"en":{"files":{"count_one":"{{count}} file","count_other":"{{count}} files"},"title":"Files"}'))
    expect(flat).toContain(squeeze('"fr":{"files":{"count_one":"{{count}} fichier","count_many":"{{count}} de fichiers","count_other":"{{count}} fichiers"}}'))
    expect(flat).toContain(squeeze('"ar":{"title":"الملفات"}'))
    // The arguments: a literal, and a binding with its compiled accessor.
    expect(flat).toMatch(/res:\{key:"files\.count",args:\[\{n:"Count",b:\{[^}]*path:"n"[^}]*,g:\(o\)=>o\.n/)
    expect(flat).toContain('{n:"Who",v:"Kim"}')
  })

  it('writes the generated declarations and check files of every view at startup', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const dts = join(APP, '.kubuno', 'views', 'src', 'Counter.kbview.d.ts')
    expect(existsSync(dts)).toBe(true)
    expect(readFileSync(dts, 'utf8')).toContain('abstract inc_click(sender: __Button, e: __MouseEventArgs): void | Promise<void>')
  })
})
