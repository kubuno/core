import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { beforeAll, describe, expect, it } from 'vitest'

import type { ViewCompiler } from '../src/compiler.js'
import { emitViewModule, isAllowedImport } from '../src/emit.js'
import { loadNodeCompiler, projectRegistryJson } from '../src/project.js'
import { decodeMappings } from '../src/sourcemap.js'
import { PKG, UI_REGISTRY } from './paths.js'

const GOLDEN = join(PKG, 'test', 'golden')
let compiler: ViewCompiler

const read = (file: string): string => readFileSync(file, 'utf8').replace(/\r\n/g, '\n')

beforeAll(async () => {
  compiler = await loadNodeCompiler()
  compiler.addRegistry(readFileSync(UI_REGISTRY, 'utf8'), 'kbview-registry.web.json', true)
  compiler.addRegistry(projectRegistryJson(PKG, join(GOLDEN, 'controls.json')), 'test/golden/controls.json', false)
})

describe('the WASM compiler', () => {
  it('reports its version and the plan ABI', () => {
    // The version of kubuno-web-views-compiler-core the committed .wasm was built from (wasm/BUILD-INFO.json's tag).
    expect(compiler.version()).toEqual({ compiler: '0.2.1', abi: 1 })
  })

  it('compiles the golden views to the committed plans, declarations, check files and modules', async () => {
    const views = readdirSync(GOLDEN).filter((f) => f.endsWith('.kbview')).sort()
    expect(views.length).toBeGreaterThanOrEqual(2)
    for (const v of views) {
      const source = read(join(GOLDEN, v))
      const out = compiler.compile(source, { file: `test/golden/${v}`, code_behind: `./${v.replace('.kbview', '')}` })
      const diagnostics = out.diagnostics.map((d) => `${d.line}:${d.column}-${d.end_line}:${d.end_column} ${d.severity} [${d.code}] ${d.message}`).join('\n')
      await expect(diagnostics + '\n').toMatchFileSnapshot(join(GOLDEN, 'out', `${v}.diagnostics.txt`))
      await expect(JSON.stringify(out.plan, null, 2) + '\n').toMatchFileSnapshot(join(GOLDEN, 'out', `${v}.plan.json`))
      await expect(out.dts).toMatchFileSnapshot(join(GOLDEN, 'out', `${v}.d.ts.txt`))
      await expect(out.check).toMatchFileSnapshot(join(GOLDEN, 'out', `${v}.check.ts.txt`))
      if (out.ok && out.plan) {
        const mod = emitViewModule(out.plan, { file: `test/golden/${v}`, source, defaultExport: false, hmr: false })
        await expect(mod.code + '\n').toMatchFileSnapshot(join(GOLDEN, 'out', `${v}.module.js.txt`))
        for (const spec of mod.imports) expect(isAllowedImport(spec), spec).toBe(true)
      }
    }
  })

  it('reports errors with positions and suggestions', () => {
    const out = compiler.compile(read(join(GOLDEN, 'errors.kbview')), { file: 'test/golden/errors.kbview' })
    expect(out.ok).toBe(false)
    const unknown = out.diagnostics.find((d) => d.code === 'unknown-element')
    expect(unknown).toMatchObject({ line: 2, column: 4, severity: 'error' })
    expect(unknown?.message).toContain('did you mean `Button`?')
  })

  it('rejects a project control that imports another module (module isolation)', async () => {
    const isolated = await loadNodeCompiler()
    isolated.addRegistry(readFileSync(UI_REGISTRY, 'utf8'), 'ui', true)
    isolated.addRegistry(
      JSON.stringify({ schema: 1, target: 'web', version: '0', components: [{ name: 'NoteCard', children: 'None', web: { module: '@kubuno/notes', export: 'NoteCard', dom_root: 'ref' } }] }),
      'controls.json',
      false,
    )
    const out = isolated.compile('<Card><Button Text="x"/></Card>', { file: 'src/a.kbview' })
    expect(out.ok).toBe(false)
    expect(out.diagnostics.some((d) => d.severity === 'error' && d.message.includes('module isolation'))).toBe(true)
    isolated.dispose()
  })

  it('maps every accessor and handler dispatcher of the module to its attribute (source map)', () => {
    const source = read(join(GOLDEN, 'settings.kbview'))
    const out = compiler.compile(source, { file: 'test/golden/settings.kbview', code_behind: './settings' })
    const mod = emitViewModule(out.plan!, { file: 'test/golden/settings.kbview', source, defaultExport: false, hmr: true })
    expect(mod.map.sources).toEqual(['settings.kbview'])
    expect(mod.map.sourcesContent?.[0]).toBe(source)
    const lines = mod.code.split('\n')
    const segments = decodeMappings(mod.map.mappings)
    const srcLines = source.split('\n')
    const at = (needle: string): { line: number; col: number } => {
      const line = lines.findIndex((l) => l.includes(needle))
      expect(line, needle).toBeGreaterThanOrEqual(0)
      return { line, col: lines[line].indexOf(needle) }
    }
    const mapped = (needle: string): string => {
      const { line, col } = at(needle)
      const seg = segments[line].filter((s) => s.col <= col).at(-1)!
      return srcLines[seg.srcLine].slice(seg.srcCol)
    }
    // The getter of {Binding busy} maps to the path `busy` in the view.
    expect(mapped('(o) => o.busy')).toMatch(/^busy\}/)
    // The setter of {Binding prefs.font, Mode=TwoWay}.
    expect(mapped('(o, v) => { o.prefs.font = v }')).toMatch(/^prefs\.font,/)
    // The dispatcher of OnClick="save_click" maps to the attribute.
    expect(mapped('(vm, s, e) => vm.save_click(s, e)')).toMatch(/^OnClick="save_click"/)
    // Icons are imported from lucide-react; the alias `trash` is Trash2.
    expect(mod.code).toMatch(/import \{ [^}]*Save as __c\d+[^}]*Trash2 as __c\d+[^}]*\} from "lucide-react"/)
    expect(mod.code).toContain('if (import.meta.hot) import.meta.hot.accept()')
  })

  it('compiles a view in a few milliseconds (one session, the registry parsed once)', () => {
    const source = read(join(GOLDEN, 'settings.kbview'))
    const t0 = performance.now()
    for (let k = 0; k < 100; k++) compiler.compile(source, { file: 'test/golden/settings.kbview', code_behind: './settings' })
    expect((performance.now() - t0) / 100).toBeLessThan(30)
  })
})
