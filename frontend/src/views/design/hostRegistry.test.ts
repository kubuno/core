import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CompilerWasm, ViewCompiler } from '../../../packages/views-compiler/src/compiler'
import { decodeHostMessage, withHostRegistry } from './protocol'

const FRONTEND = resolve(__dirname, '..', '..', '..')
const UI_REGISTRY = join(FRONTEND, 'packages', 'ui', 'kbview-registry.web.json')
const WASM = join(FRONTEND, 'packages', 'views-compiler', 'wasm', 'kubuno-views-web.wasm')

/** The project's registry (today's `@kubuno/ui`), and the one a design host built before `HtmlTag` existed carries. */
function registries(): { current: string; older: string } {
  const current = readFileSync(UI_REGISTRY, 'utf8')
  const doc = JSON.parse(current) as { components: { name: string; properties?: { name: string }[] }[] }
  for (const c of doc.components) {
    if (c.name === 'Label' && c.properties) c.properties = c.properties.filter((p) => p.name !== 'HtmlTag')
  }
  return { current, older: JSON.stringify(doc) }
}

async function errorsWith(texts: readonly string[], source: string): Promise<string[]> {
  const compiler = new ViewCompiler(await CompilerWasm.instantiate(await WebAssembly.compile(readFileSync(WASM))))
  texts.forEach((t, k) => compiler.addRegistry(t, k === 0 ? 'host' : `project-${k}`, k === 0))
  const out = compiler.compile(source, { file: 'src/DrivePage.kbview', code_behind: null, class_name: null, design: true })
  compiler.dispose()
  return out.diagnostics.filter((d) => d.severity === 'error').map((d) => d.message)
}

const VIEW = '<Stack xmlns="https://kubuno.com/views"><Label HtmlTag="H1" Text="Mon Drive"/></Stack>'

describe('the host registry the designer sends (setHostRegistry)', () => {
  it('decodes, and only a non-empty text', () => {
    expect(decodeHostMessage({ type: 'setHostRegistry', text: '{"components":[]}' })).toEqual({ type: 'setHostRegistry', text: '{"components":[]}' })
    expect(decodeHostMessage({ type: 'setHostRegistry', text: '  ' })).toBeNull()
    expect(decodeHostMessage({ type: 'setHostRegistry' })).toBeNull()
  })

  it('replaces the bundled page\'s own host registry, keeps the project registries, and is ignored in project mode', () => {
    expect(withHostRegistry(['old', 'project'], false, 'new')).toEqual(['new', 'project'])
    expect(withHostRegistry([], false, 'new')).toEqual(['new'])
    expect(withHostRegistry(['new', 'project'], false, 'new')).toBeNull()
    expect(withHostRegistry(['project-json-host'], true, 'new')).toBeNull()
  })

  it('reproduces drive\'s « Label has no property HtmlTag » with an older bundled registry, and compiles clean with the project\'s', async () => {
    const { current, older } = registries()
    expect(current).toContain('"HtmlTag"')
    const before = await errorsWith([older], VIEW)
    expect(before.join('\n')).toMatch(/`Label` has no property( or event)? `HtmlTag`/)
    const after = withHostRegistry([older], false, current)
    expect(after).not.toBeNull()
    expect(await errorsWith(after!, VIEW)).toEqual([])
  })
})
