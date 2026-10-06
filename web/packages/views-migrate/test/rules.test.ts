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

  it('copies a local component both render into each file, and drops it from the old one', () => {
    expect(created('First')).toMatch(/function Tag\(/)
    expect(created('Second')).toMatch(/function Tag\(/)
    expect(edited('Pair')).not.toMatch(/Tag/)
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
    expect(b.code).toMatch(/get sessions\(\)(: \w+)? \{\s*if \(!\(!!\(this\.outcome\)\)\) return undefined as never\s*return this\.outcome\.sessions/)
    expect(b.view).toMatch(/<Label Text="\{Binding sessions\}"[^>]*Visible="\{Binding show_case_1\}"/s)
  })
})

describe('hooks reading constants of earlier hooks', () => {
  it('publishes a hook result at once in useHooks(), before a later hook reads a getter built on it', () => {
    const o = convert('Ordered.tsx')
    expect(o.code).toMatch(/const groups = useMemo\([^\n]*\n\s*this\.publish\(\{ groups \}\)\s*\n\s*useEffect/)
  })
})

describe('early returns nested in a branch block', () => {
  it('gives the inner return its own case, under the block condition', () => {
    const b = convert('Branch2.tsx')
    expect(b.result.status).toBe('converted')
    expect(b.code).toMatch(/get show_case_2\(\)[^{]*\{\s*return !\(\(!this\.props\.scoped\) && \(this\.n === 0\)\) && !!\(!this\.props\.scoped\)/)
  })
})

describe('collections filled by statements of the body', () => {
  it('runs the filling statements, with the functions they call, in the collection getter', () => {
    const f = convert('Fill.tsx')
    expect(f.result.status).toBe('converted')
    expect(f.code).toMatch(/get rows\(\)[^\n]*\n\s*return this\.memo\('rows', \[[^\]]*\], \(\) => \(\(\) => \{\s*const rows: \{ unit: Unit; depth: number \}\[\] = \[\]\s*const walk = \(u: Unit, depth: number\) => \{\s*rows\.push/)
    expect(f.code).toMatch(/if \(this\.root\) walk\(this\.root, 0\)\s*return rows/)
  })
})

describe('aliased conditions', () => {
  it('declares the condition and what it narrows as constants of the getter', () => {
    const a = convert('Alias.tsx')
    expect(a.code).toMatch(/get delta\(\)[^\n]*\n\s*const previous = this\.props\.previous\s*\n\s*const snapshot = previous === null\s*\n\s*return !snapshot && previous > 0/)
  })
})

describe('the bundles of a module', () => {
  it('reads a generated `src/i18n.data.json` catalogue under the namespace its `i18n.ts` registers', async () => {
    const { jsonBundles } = await import('../src/project.js')
    const keys = jsonBundles(join(FIXTURES, 'module-i18n'), 'en').get('drive')
    expect(keys?.has('app.title')).toBe(true)
    expect(keys?.has('app.nested.deep')).toBe(true)
  })
})

describe('inline handlers', () => {
  it("types an untyped event parameter with React's event, and guards a conditional handler by its condition", () => {
    const h = convert('Handlers.tsx')
    expect(h.code).toMatch(/const e = args\.native as React\.DragEvent<HTMLDivElement/)
    expect(h.code).toMatch(/if \(!\(this\.props\.onOpen\)\) return undefined as never\s*\n\s*this\.props\.onOpen\('a'\)/)
  })
})

describe('screens with nothing to convert', () => {
  it('leaves a screen whose every element stays React as it is', () => {
    const w = convert('Wrapper.tsx')
    expect(w.result.status).toBe('skipped')
    expect(Object.keys(w.result.outputs)).toHaveLength(0)
    expect(w.result.deletes).toHaveLength(0)
  })
})

describe('data attributes', () => {
  it('turns written data-* attributes into DataAttributes, and computed ones into a getter building the list', () => {
    const d = convert('DataAttrs.tsx')
    expect(d.view).toContain('DataAttributes="app-shell; kind=main"')
    expect(d.view).toMatch(/DataAttributes="\{Binding aside_data\}"/)
    expect(d.code).toContain(`["app-chrome", ((v: unknown) => (v === undefined || v === null ? '' : "module=" + String(v)))(this.props.moduleId)`)
  })
})

describe('narrowed components and navigation', () => {
  it('passes a narrowed component written as a tag under a capitalised prop, and keeps one navigate', () => {
    const n = convert('NarrowTag.tsx')
    expect(n.parts).toMatch(/<Cfg_Body \/>/)
    expect(n.parts).toMatch(/Cfg_Body: /)
    expect(n.code.match(/navigate!:/g)?.length).toBe(1)
  })
})

describe('methods passed as values', () => {
  it('binds a setter given as a value once per view', () => {
    const r = convert('RefSetter.tsx')
    expect(r.code).toContain(`this.memo("setNode:bound", [], () => this.setNode.bind(this))`)
    expect(r.code).not.toMatch(/[^>] this\.setNode\.bind\(this\)/)
  })
})

describe('parts', () => {
  it('keeps the lines of a template literal as they are when it indents a part', async () => {
    const { indentCode } = await import('../src/migrate.js')
    const code = '<pre className="x">{`{\n  "id": 1\n}`}</pre>'
    expect(indentCode(`<div>\n${code}\n</div>`, '    ')).toBe(`<div>\n    ${code}\n    </div>`)
  })
})

describe('hooks inside expressions', () => {
  it('runs a hook called inside an expression in use(), not in a getter', () => {
    const h = convert('HookExpr.tsx')
    expect(h.code).not.toMatch(/get pathname\(\)/)
    expect(h.code).toMatch(/useStores\(\) \{[^]*const pathname = useLocation\(\)\.pathname/)
    expect(h.code).toMatch(/const hash = useLocation\(\)\.hash \|\| /)
  })
})

describe('hooks called to render again', () => {
  it('keeps the value of a hook the TSX dropped, and makes every memo depend on it', () => {
    const r = convert('Rerender.tsx')
    expect(r.code).toMatch(/this\.rerender1 = useVersionStore\(\(s\) => s\.version\)/)
    expect(r.code).toMatch(/this\.memo\('hit', \[this\.pathname, this\.rerender1\]/)
  })
})

describe('defects found migrating drive (WEB-VIEWS §22.4)', () => {
  let d: Converted
  beforeAll(() => {
    d = convert('Defects.tsx')
  }, 120_000)

  it('writes a type its file shadows (lucide `Folder` vs a module `Folder`) through its module', () => {
    expect(d.code).toMatch(/get folders\(\): import\("\.\/defects-types"\)\.Folder\[\]/)
    // The icon, used by the view only, is no import of the code-behind any more.
    expect(d.code).not.toMatch(/import \{ Folder \} from "lucide-react"/)
  })

  it('copies a helper a part uses only inside a template literal', () => {
    expect(d.parts).toMatch(/^const absUrl = /m)
    expect(d.parts).toMatch(/^function embedCss\(/m)
  })

  it('keeps a static style next to a computed class in the same Class', () => {
    expect(d.view).toMatch(/<Panel Class="\{Binding div_class\}"/)
    expect(d.code).toContain("return `flex items-end ${this.mobile ? 'px-1' : 'px-4'} [background:#fff]`")
  })

  it('keeps several text runs as several text nodes (a list of runs)', () => {
    expect(d.code).toMatch(/get span_text\(\) \{\n\s*return this\.memo\('span_text', \[this\.props\], \(\) => \[[^\n]*this\.props\.used\), " \/ ", [^\n]*this\.props\.quota\)\] as unknown as string\)/)
  })

  it('leaves a label around a checkbox whole in React, its text a bare text node', () => {
    expect(d.view).not.toMatch(/HtmlTag="Label"/)
    expect(d.parts).toMatch(/<label className="flex items-center gap-2 text-sm">\s*<input type="checkbox"[^\n]*\/>\s*Remember me\s*<\/label>/)
  })
})

describe('default texts', () => {
  it("writes them into a module's catalogue and generates its i18n.ts again", async () => {
    const { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { storeDefaults } = await import('../src/cli.js')
    const root = mkdtempSync(join(tmpdir(), 'kbview-defaults-'))
    try {
      mkdirSync(join(root, 'src'))
      writeFileSync(join(root, 'src', 'i18n.data.json'), JSON.stringify({ en: { app: { title: 'Drive' } }, fr: { app: { title: 'Drive' } } }))
      writeFileSync(join(root, 'src', 'i18n.ts'), "registerModuleTranslations('drive', {})\n")
      writeFileSync(join(root, 'src', 'gen_i18n.mjs'), [
        "import { readFileSync, writeFileSync } from 'node:fs'",
        "const d = JSON.parse(readFileSync(new URL('./i18n.data.json', import.meta.url), 'utf8'))",
        "writeFileSync(new URL('./i18n.ts', import.meta.url), `registerModuleTranslations('drive', ${JSON.stringify(d)})\n`)",
      ].join('\n'))
      const r = storeDefaults(root, [
        { ns: 'drive', key: 'search.similar_to', value: 'Images similaires à « {{name}} »' },
        { ns: 'drive', key: 'app.title', value: 'ignored: translated already' },
        { ns: 'other', key: 'x', value: 'X' },
      ])
      const data = JSON.parse(readFileSync(join(root, 'src', 'i18n.data.json'), 'utf8'))
      expect(data.en.search.similar_to).toBe('Images similaires à « {{name}} »')
      expect(data.en.app.title).toBe('Drive')
      expect(readFileSync(join(root, 'src', 'i18n.ts'), 'utf8')).toContain('similar_to')
      // A namespace with neither bundle nor catalogue: views-defaults.json, and the log says nothing loads it.
      expect(r.left.map((x) => x.key)).toEqual(['x'])
      expect(existsSync(join(root, 'src', 'views-defaults.json'))).toBe(true)
      expect(r.log.join('\n')).toMatch(/generated again[^]*NOTHING LOADS/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
