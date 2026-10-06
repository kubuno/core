/**
 * Views and user controls (VIEWS-SPEC §1.1–1.2): the classification of a project's components, the folder each one
 * goes to, the importers rewritten, a view's markup turned into a user control's, and the codemod writing a user
 * control directly. Fixture: `test/fixtures/layout` (a module with routes, a slot, a dialog, rows, a feature folder).
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { classify, existsIn, listFiles, nameCollisions, planLayout, readSources, relocate, slash, toControlText, toViewText, unitsOf, type Classified } from '../src/layout.js'
import { applyRelayout, planRelayout } from '../src/relayout.js'
import { migrateFile } from '../src/migrate.js'
import { openProject } from '../src/project.js'

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE = slash(join(PKG, 'test', 'fixtures', 'layout'))
const SRC = `${FIXTURE}/src`

let units: Classified[]
const unit = (stem: string): Classified => units.find((u) => u.stem === stem)!

beforeAll(() => {
  const files = listFiles(SRC)
  units = classify(unitsOf(files, { components: true }), readSources(files), files)
})

describe('classification', () => {
  it('makes a routed page a view: a route table, a lazy route, the app root rendering it alone', () => {
    expect(unit('AboutPage')).toMatchObject({ role: 'view', kind: 'page' })
    expect(unit('SettingsPage')).toMatchObject({ role: 'view', kind: 'page' })
    expect(unit('SettingsPage').reason).toMatch(/rendered by a route \(entry\.ts:7\)/)
    expect(unit('HomePage')).toMatchObject({ role: 'view', kind: 'page' })
    expect(unit('Notice')).toMatchObject({ role: 'view', kind: 'page' })
  })

  it('makes a dialog a view, whoever opens it', () => {
    expect(unit('EditDialog')).toMatchObject({ role: 'view', kind: 'dialog' })
  })

  it('makes a component other components place a user control, shared when several do', () => {
    expect(unit('Row')).toMatchObject({ role: 'control', kind: 'part', hosts: [`${SRC}/List`] })
    expect(unit('List')).toMatchObject({ role: 'control', kind: 'part' })
    expect(unit('Badge')).toMatchObject({ role: 'control', kind: 'shared' })
    expect(unit('Badge').hosts.length).toBe(3)
    // A slot is a host placing it; `{ path, Icon: X }` is no route.
    expect(unit('SidePanel')).toMatchObject({ role: 'control', kind: 'part' })
    // Next to other elements in the app root: a part, not a page.
    expect(unit('Title')).toMatchObject({ role: 'control' })
    // Only a named helper of it is imported: the component is used nowhere.
    expect(unit('Thing')).toMatchObject({ role: 'control', reason: 'used nowhere' })
  })
})

describe('layout', () => {
  const moves = (): Map<string, string> => new Map(planLayout(units, { roots: [SRC] }).map((m) => [m.from.slice(SRC.length + 1), m.to.slice(SRC.length + 1)]))

  it('puts the app root by role: views/, dialogs/, pages/ (one host), controls/ (several)', () => {
    const m = moves()
    expect(m.get('SettingsPage.kbview')).toBe('views/SettingsPage.kbview')
    expect(m.get('SettingsPage.ts')).toBe('views/SettingsPage.ts')
    expect(m.get('HomePage.tsx')).toBe('views/HomePage.tsx')
    expect(m.get('EditDialog.kbview')).toBe('dialogs/EditDialog.kbview')
    expect(m.get('List.kbview')).toBe('pages/List.kbcontrol')
    expect(m.get('List.parts.tsx')).toBe('pages/List.parts.tsx')
    expect(m.get('Row.kbview')).toBe('pages/Row.kbcontrol')
    expect(m.get('Badge.kbview')).toBe('controls/Badge.kbcontrol')
    expect(m.get('SidePanel.ts')).toBe('pages/SidePanel.ts')
  })

  it('re-places a role folder by role, keeps feature folders flat and the app component in place', () => {
    const m = moves()
    expect(m.get('pages/AboutPage.kbview')).toBe('views/AboutPage.kbview')
    expect(m.get('feature/Thing.kbview')).toBe('feature/Thing.kbcontrol')
    expect(m.has('feature/Thing.ts')).toBe(false)
    expect(m.has('App.tsx')).toBe(false)
  })

  it('splits a folder past the threshold by role', () => {
    const m = new Map(planLayout(units, { roots: [], split: 3 }).map((x) => [x.from.slice(SRC.length + 1), x.to.slice(SRC.length + 1)]))
    expect(m.get('Badge.kbview')).toBe('controls/Badge.kbcontrol')
    // Not past it: flat.
    expect(m.get('feature/Thing.kbview')).toBe('feature/Thing.kbcontrol')
  })

  it('reports the user controls whose element name is taken', () => {
    expect([...nameCollisions(units, new Set(['Badge']))]).toEqual([['Badge', [`${SRC}/Badge.kbview`]]])
    expect(nameCollisions(units, new Set(['Badge']), new Map([[`${SRC}/Badge.kbview`, 'LockBadge']])).size).toBe(0)
  })
})

describe('relocation', () => {
  it("rewrites the importers and the moved files' own imports, and the headers naming the view", () => {
    const files = listFiles(SRC)
    const moves = planLayout(units, { roots: [SRC] })
    const { moved, edited } = relocate(readSources(files), moves, existsIn(files))
    const app = edited.get(`${SRC}/App.tsx`)!
    expect(app).toContain(`from './views/AboutPage'`)
    expect(app).toContain(`from './views/HomePage'`)
    expect(app).toContain(`from './views/Notice'`)
    expect(app).toContain(`from './pages/Title'`)
    const entry = edited.get(`${SRC}/entry.ts`)!
    expect(entry).toContain(`import('./views/SettingsPage')`)
    expect(entry).toContain(`from './pages/SidePanel'`)
    const badge = moved.get(`${SRC}/controls/Badge.ts`)!
    expect(badge).toContain(`from './Badge.kbcontrol'`)
    expect(badge).toContain('Code-behind of `Badge.kbcontrol`')
    expect(moved.get(`${SRC}/views/SettingsPage.ts`)).toContain(`from '../feature/Thing'`)
    const parts = moved.get(`${SRC}/pages/List.parts.tsx`)!
    expect(parts).toContain(`from '../controls/Badge'`)
    expect(parts).toContain(`from './Row'`)
    expect(edited.get(`${SRC}/feature/Thing.ts`)).toContain(`from '../controls/Badge'`)
  })

  describe('on disk (git mv when tracked, else a rename)', () => {
    let dir = ''
    beforeAll(() => {
      dir = slash(mkdtempSync(join(tmpdir(), 'kbview-layout-')))
      cpSync(FIXTURE, dir, { recursive: true })
      const plan = planRelayout({ root: dir, components: true, rename: [{ unit: 'src/Row.kbview', stem: 'ListRow' }] })
      applyRelayout(dir, plan)
    })
    afterAll(() => rmSync(dir, { recursive: true, force: true }))

    it('moves the files, renames a user control and its class, and converts the markup', () => {
      expect(existsSync(`${dir}/src/Row.kbview`)).toBe(false)
      const view = readFileSync(`${dir}/src/pages/ListRow.kbcontrol`, 'utf8')
      expect(view).toMatch(/^<UserControl x:Props="RowProps">\n {2}<Stack Direction="LeftToRight"\n {9}Gap="8"/m)
      const code = readFileSync(`${dir}/src/pages/ListRow.ts`, 'utf8')
      expect(code).toContain('export class ListRow extends ViewBase')
      expect(code).toContain('export default ListRow.component()')
      expect(code).toContain(`from './ListRow.kbcontrol'`)
      expect(readFileSync(`${dir}/src/pages/List.parts.tsx`, 'utf8')).toContain(`import Row from './ListRow'`)
      expect(readFileSync(`${dir}/src/dialogs/EditDialog.kbview`, 'utf8')).toMatch(/^<Panel x:Props="EditDialogProps"/)
    })

    it('is idempotent: a second run moves nothing, a split folder\'s role folders included', () => {
      expect(planRelayout({ root: dir, components: true }).moves).toEqual([])
      const split = planRelayout({ root: dir, appRoots: [], components: true, split: 1 })
      applyRelayout(dir, split)
      expect(planRelayout({ root: dir, appRoots: [], components: true, split: 1 }).moves).toEqual([])
    })
  })
})

describe('view markup and user control markup', () => {
  it("wraps the root in a UserControl taking the file's attributes, and gives them back", () => {
    const view = '<!-- Badge -->\n<Icon x:Props="BadgeProps" Name="Lock" Size="12" Visible="{Binding shown}"/>\n'
    const control = toControlText(view)
    expect(control).toBe('<!-- Badge -->\n<UserControl x:Props="BadgeProps">\n  <Icon Name="Lock" Size="12" Visible="{Binding shown}"/>\n</UserControl>\n')
    expect(toViewText(control)).toBe(view)
  })

  it('leaves the lines inside a multi-line attribute value as they are', () => {
    const view = '<Panel x:Props="P" ToolTip="one\ntwo">\n  <Label Text="a"/>\n</Panel>\n'
    expect(toControlText(view)).toBe('<UserControl x:Props="P">\n  <Panel ToolTip="one\ntwo">\n    <Label Text="a"/>\n  </Panel>\n</UserControl>\n')
  })

  it('keeps a user control whose root docks its children', () => {
    expect(toViewText('<UserControl Padding="4">\n  <Label/>\n</UserControl>\n')).toBeUndefined()
  })
})

describe('the codemod writes a user control', () => {
  it('as X.kbcontrol, its markup in a UserControl, the code-behind and parts naming it', () => {
    const FRONTEND = resolve(PKG, '..', '..')
    const SAMPLE = join(PKG, 'test', 'fixtures', 'Sample.tsx')
    const { project, config } = openProject(FRONTEND, [SAMPLE])
    const r = migrateFile(config, project.getSourceFileOrThrow(SAMPLE), undefined, { role: 'control' })
    const out = (suffix: string): string => Object.entries(r.outputs).find(([p]) => p.endsWith(suffix))?.[1] ?? ''
    expect(Object.keys(r.outputs).some((p) => p.endsWith('Sample.kbview'))).toBe(false)
    expect(out('Sample.kbcontrol')).toMatch(/^<UserControl x:Props="SampleProps">$/m)
    expect(out('Sample.ts') || out('Sample.tsx')).toContain(`import { ViewBase } from './Sample.kbcontrol'`)
    expect(out('Sample.parts.tsx')).toContain('`Sample.kbcontrol`')
  }, 120_000)
})
