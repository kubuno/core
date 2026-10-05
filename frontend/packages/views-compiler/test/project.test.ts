import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve, sep } from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

import { GENERATED_DIR, generatedPaths, generatedRelPath, writeGenerated } from '../src/project.js'
import type { CompileOutput } from '../src/types.js'

const work = mkdtempSync(join(tmpdir(), 'kbview-paths-'))
afterAll(() => rmSync(work, { recursive: true, force: true }))

/** Every file under `dir`, relative to it. */
function filesUnder(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      const full = join(d, name)
      if (statSync(full).isDirectory()) walk(full)
      else out.push(relative(dir, full))
    }
  }
  walk(dir)
  return out
}

describe('generated file paths', () => {
  const root = join(work, 'project')
  const generated = join(root, GENERATED_DIR)

  it('keeps a view of the project at its root-relative path', () => {
    const view = join(root, 'src', 'core', 'A.kbview')
    expect(generatedRelPath(root, view)).toBe('src/core/A.kbview')
    expect(generatedPaths(root, view)).toEqual({
      dts: join(generated, 'src', 'core', 'A.kbview.d.ts'),
      check: join(generated, 'src', 'core', 'A.kbview.check.ts'),
      map: join(generated, 'src', 'core', 'A.kbview.check.json'),
    })
  })

  it('puts a view outside the project root under _external, never outside .kubuno/views', () => {
    const sibling = join(work, 'shared', 'B.kbcontrol')
    const viaDots = join(root, '..', '..', 'elsewhere', 'C.kbview')
    for (const view of [sibling, viaDots, resolve('/', 'abs', 'D.kbview')]) {
      const rel = generatedRelPath(root, view)
      expect(rel.startsWith('_external/'), rel).toBe(true)
      expect(rel.split('/')).not.toContain('..')
      expect(rel).not.toContain(':')
      for (const p of Object.values(generatedPaths(root, view))) {
        expect(p.startsWith(generated + sep), p).toBe(true)
      }
    }
    // The absolute path's segments, a drive letter losing its colon.
    const segments = resolve(sibling).split(/[\\/]/).filter((s) => s).map((s) => s.replace(/:/g, ''))
    expect(generatedRelPath(root, sibling)).toBe(['_external', ...segments].join('/'))
  })

  it('writes the three files of an outside view inside .kubuno/views only', () => {
    const view = join(work, 'shared', 'E.kbview')
    const out = { dts: '// d', check: '// c', check_map: [], handlers: [], class_name: 'E' } as unknown as CompileOutput
    writeGenerated(root, view, out)
    const written = filesUnder(work).filter((f) => !f.startsWith('shared'))
    expect(written.length).toBe(3)
    for (const f of written) expect(join(work, f).startsWith(generated + sep), f).toBe(true)
  })
})
