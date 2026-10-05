/**
 * The conversion rules added while migrating the core screens in bulk (WEB-VIEWS §21): each was written by hand at
 * least twice before becoming a rule. One fixture per group of rules; the assertions name the rule they check.
 */
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeAll, describe, expect, it } from 'vitest'

import { migrateFile, type MigrationResult } from '../src/migrate.js'
import { openProject } from '../src/project.js'
import { splitFile } from '../src/split.js'

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FRONTEND = resolve(PKG, '..', '..')
const FIXTURES = join(PKG, 'test', 'fixtures')

interface Converted {
  result: MigrationResult
  view: string
  code: string
  parts: string
}

function convert(file: string, component?: string): Converted {
  const path = join(FIXTURES, file)
  const { project, config } = openProject(FRONTEND, [path])
  const result = migrateFile(config, project.getSourceFileOrThrow(path), component)
  const stem = file.replace(/\.tsx$/, '')
  const out = (suffix: string) => Object.entries(result.outputs).find(([p]) => p.endsWith(suffix))?.[1] ?? ''
  return { result, view: out(`${stem}.kbview`), code: out(`${stem}.ts`) || out(`${stem}.tsx`), parts: out(`${stem}.parts.tsx`) }
}

describe('rules of the bulk migration', () => {
  let r: Converted
  beforeAll(() => {
    r = convert('Rules.tsx')
  }, 120_000)

  it('reads `@ui/<Component>` imports as `@ui` (FloatingWindow, ConfirmDialog)', () => {
    expect(r.view).toMatch(/^<FloatingWindow /m)
  })

  it('feeds object props field by field, nested paths included (window footer, empty-state action)', () => {
    expect(r.view).toMatch(/<FloatingWindow[^>]*ConfirmText="\{Res common\.save\}"/s)
    expect(r.view).toMatch(/<FloatingWindow[^>]*ConfirmEnabled="\{Binding enabled_unless_busy\}"/s)
    expect(r.view).toMatch(/<FloatingWindow[^>]*ConfirmBusy="\{Binding busy\}"/s)
    expect(r.view).toMatch(/<FloatingWindow[^>]*CancelText="\{Res common\.cancel\}"/s)
    expect(r.view).toMatch(/<FloatingWindow[^>]*OnConfirm="save"/s)
    expect(r.view).toMatch(/<EmptyState[^>]*ActionLabel="\{Res common\.add\}"[^>]*OnAction="save"/s)
  })

  it('gives the host strings to an element whose `t` matters, leaves it out where it changes nothing', () => {
    expect(r.view).toMatch(/<FloatingWindow[^>]*HostStrings="true"/s)
    // A Callout without its close button, an EmptyState without a documentation link: `t` unused.
    expect(r.view).toMatch(/<Callout Body="\{Res rules\.note\}"\/>/)
    expect(r.view).not.toMatch(/<EmptyState[^>]*HostStrings/s)
  })

  it('writes element props as property elements (Card actions)', () => {
    expect(r.view).toMatch(/<Card Title="\{Res rules\.card\}">\s*<Card\.Actions>\s*<Button Size="Sm" Text="\{Res common\.add\}" OnClick="save"\/>\s*<\/Card\.Actions>/)
  })

  it('renders a component given spread props through a ReactHost, without a part', () => {
    expect(r.view).toMatch(/<ReactHost Component="\{Binding ConfirmDialog\}" Props="\{Binding confirm_dialog_props\}"[^>]*\/>/s)
    expect(r.code).toMatch(/\.\.\.this\.confirmState, onConfirm: this\.handleConfirm, onCancel: this\.handleCancel/)
    expect(r.parts).toBe('')
  })
})

describe('the split pre-pass (--split)', () => {
  let s: ReturnType<typeof splitFile>
  beforeAll(() => {
    const pair = join(FIXTURES, 'split', 'Pair.tsx')
    const user = join(FIXTURES, 'split', 'PairUser.tsx')
    const { project, config } = openProject(FRONTEND, [pair, user])
    s = splitFile(config, project.getSourceFileOrThrow(pair))
  }, 120_000)

  const created = (name: string): string => Object.entries(s!.created).find(([p]) => p.endsWith(`/${name}.tsx`))?.[1] ?? ''
  const edited = (name: string): string => Object.entries(s!.edits).find(([p]) => p.endsWith(`/${name}.tsx`))?.[1] ?? ''

  it('moves each exported component to a file of its own, with what only it uses', () => {
    expect(s!.moved.map((x) => x.component)).toEqual(['First', 'Second'])
    expect(created('First')).toMatch(/const FIRST_CLASS = 'text-sm'/)
    expect(created('First')).toMatch(/\/\*\* The first screen\. \*\/\s*export function First/)
    expect(created('Second')).toMatch(/\/\/ The second screen, which shows the first\.\s*export function Second/)
  })

  it('imports what stays shared from the old file (types as types), and the other split component from its file', () => {
    expect(created('First')).toContain("import { type Mode, label } from './Pair'")
    expect(created('Second')).toContain("import { label } from './Pair'")
    expect(created('Second')).toContain("import { First } from './First'")
    expect(created('Second')).toContain("import { useTranslation } from \"react-i18next\"")
    expect(created('First')).not.toContain('react-i18next')
  })

  it('keeps the shared helpers in the old file, exported, without the moved code and its comments', () => {
    const old = edited('Pair')
    expect(old).toMatch(/export function label/)
    expect(old).toMatch(/export type Mode/)
    expect(old).not.toMatch(/First|Second|FIRST_CLASS|useTranslation|@ui/)
  })

  it('switches the importers to the new files', () => {
    const u = edited('PairUser')
    expect(u).toContain("import { type Mode } from './Pair'")
    expect(u).toContain("import { First } from './First'")
    expect(u).toContain("import { Second } from './Second'")
  })
})

describe('early returns with constants of their own', () => {
  it('turns the block constants into getters guarded by the branch condition', () => {
    const b = convert('Branch.tsx')
    expect(b.result.status).toBe('converted')
    expect(b.code).toMatch(/get sessions\(\) \{\s*if \(!\(!!\(this\.outcome\)\)\) return undefined as never\s*return this\.outcome\.sessions/)
    expect(b.view).toMatch(/<Label Text="\{Binding sessions\}"[^>]*Visible="\{Binding show_case_1\}"/s)
  })
})
