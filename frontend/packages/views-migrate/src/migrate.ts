/**
 * The codemod: one `.tsx` screen → `X.kbview` + `X.ts` code-behind (+ `X.parts.tsx` for what stays React) + a report
 * (vskubuno docs/WEB-VIEWS.md §6.2, lot WV-11).
 *
 * The component's body becomes the code-behind class:
 *
 * | TSX | code-behind |
 * |---|---|
 * | `const [x, setX] = useState(init)` (static `init`) | `@bind accessor x = init`; `setX(v)` → `this.x = v`, `setX(f => …)` → `this.x = …` |
 * | other hooks (`useTranslation`, stores, `useEffect`, custom hooks) | moved verbatim into `use()`; the locals they declare become fields assigned there (`@bind` for data) |
 * | a derived constant (`const n = items.length`) | a getter (memoized when it builds an object) |
 * | a local function | a method |
 * | props (`{ a, b }: Props`) | `this.props.a`, the root's `x:Props` |
 *
 * and the JSX becomes markup: `@ui` components by reverse registry lookup, intrinsic elements as `Panel` / `Stack` /
 * `Label` (with their HTML tag when it is not a `div` / `p`, so the DOM — and the accessibility tree — stay the
 * same), classes mapped to properties where it is exact (`classes.ts`, the rest in `Class`), `t('k')` → `{Res k}`,
 * expressions → `{Binding …}` (a getter when not a plain path), `cond && <X/>` → `Visible`, `list.map(…)` →
 * `Repeater` over memoized rows, inline handlers → methods. What does not convert (a local component, a raw
 * `<input>`, an unmapped prop…) is cut out as a part — a component in `X.parts.tsx` rendered through
 * `<ReactHost Component=… Props=…/>` — so the screen still renders the same; each cut is a reason in the report.
 */
import { basename, dirname, join, relative } from 'node:path'

import { Node, ts, type JsxElement, type JsxSelfClosingElement, type Project, type SourceFile } from 'ts-morph'

import { isSafeLiteral, cleanJsxText, decodeEntities } from './jsxtext.js'
import { mapContainerClasses, mapLabelClasses, mapStackClasses, mapStaticStyle } from './classes.js'
import type { ElementInfo, Registry } from './registry.js'
import { attr, writeXml, type XNode } from './xml.js'

export type Status = 'converted' | 'partial' | 'skipped'

export interface MigrateConfig {
  project: Project
  registry: Registry
  /** The project root (`core/frontend`), for relative paths in the report. */
  root: string
  /** i18next default namespace of the project (`core`). */
  defaultNs: string
  /** Whether `key` exists in namespace `ns`'s fallback-language bundle (a `{Res}` without it needs its default). */
  hasKey: (ns: string, key: string) => boolean
}

export interface MigrationStats {
  elements: number
  mapped: number
  classAttributes: number
  parts: number
  getters: number
  handlers: number
  bindings: number
  resources: number
}

export interface MigrationResult {
  file: string
  component?: string
  status: Status
  reasons: string[]
  stats: MigrationStats
  /** Files to write (path → text). */
  outputs: Record<string, string>
  /** Files to delete (the `.tsx`). */
  deletes: string[]
  /** Other files of the project rewritten (importers switched to the default export). */
  edits: Record<string, string>
  /** `{Res}` keys missing from the fallback bundle, with the `defaultValue` the TSX gave them. */
  defaults: Array<{ ns: string; key: string; value: string }>
}

type FnLike = Node & { getBody(): Node | undefined; getParameters(): Node[] }

const HOOK = /^use[A-Z0-9]/

/** What a component-scope name becomes in the class. */
type Kind = 'state' | 'setter' | 'hook-data' | 'hook-fn' | 'derived' | 'method' | 'prop' | 'props-object' | 'translate'

interface Local {
  name: string
  kind: Kind
  /** The class member it is reached through (`this.<member>`). */
  member: string
  /** For a setter: the state member. */
  state?: string
  decl: ts.Node
  /** TypeScript type text of the field (`@bind accessor x: T`). */
  type?: string
  init?: string
  /** For `translate`: the namespace of its `useTranslation(ns)`. */
  ns?: string
}

interface Getter {
  name: string
  body: string
  /** It builds an object: memoized on the members it reads. */
  memo: boolean
  doc?: string
  type?: string
  /** Conditions (class expressions) under which the getter is read: outside them it returns undefined. */
  guards?: string[]
}

interface Method {
  name: string
  params: string
  body: string
  async: boolean
  doc?: string
  /** `<K extends …>` of a generic function. */
  typeParams?: string
}

interface Part {
  name: string
  /** Free variables passed as props: prop name → expression in the class (or row). */
  props: Array<{ name: string; expr: string; type?: string }>
  jsx: string
  rowScoped: boolean
}

/** A Repeater template scope: the map callback's parameters, and the row fields computed for it. */
interface RowScope {
  /** Getter producing the rows (`rows_1`). */
  getter: string
  /** Parameter names of the map callback (item, index). */
  params: string[]
  paramDecls: ts.Node[]
  /** Row fields: name → expression (in terms of the params and `this.*`). */
  fields: Map<string, string>
  key?: string
}

const VIEW_MEMBERS = new Set(['props', 'dataContext', 'use', 't', 'invalidate', 'component', 'constructor', 'memo'])

const INTRINSIC_CONTAINERS: Readonly<Record<string, string>> = {
  div: 'Div', section: 'Section', nav: 'Nav', header: 'Header', footer: 'Footer', main: 'Main', aside: 'Aside',
  form: 'Form', ul: 'Ul', ol: 'Ol', li: 'Li', fieldset: 'Fieldset', article: 'Article', figure: 'Figure',
  span: 'Span', p: 'P', label: 'Label', h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5', h6: 'H6', strong: 'Strong', em: 'Em', small: 'Small', code: 'Code',
}
const TEXT_TAGS: Readonly<Record<string, string>> = {
  p: 'P', span: 'Span', h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5', h6: 'H6', strong: 'Strong', em: 'Em', small: 'Small', label: 'Label', code: 'Code', div: 'Div', li: 'Li',
}
/** ARIA role → `AccessibleRole` (the inverse of the registry's container map, unambiguous entries). */
const ROLE_OF_ARIA: Readonly<Record<string, string>> = {
  dialog: 'Dialog', alert: 'Alert', menu: 'MenuPopup', menuitem: 'MenuItem', tooltip: 'ToolTip', group: 'Grouping',
  separator: 'Separator', toolbar: 'ToolBar', status: 'StatusBar', table: 'Table', row: 'Row', cell: 'Cell', link: 'Link',
  list: 'List', listitem: 'ListItem', tree: 'Outline', treeitem: 'OutlineItem', tab: 'PageTab', tabpanel: 'PropertyPage',
  img: 'Graphic', button: 'PushButton', checkbox: 'CheckButton', radio: 'RadioButton', tablist: 'PageTabList',
  region: 'Pane', none: 'None', presentation: 'None', banner: 'TitleBar', document: 'Document', application: 'Application',
}

function snake(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()
}
function pascal(s: string): string {
  return s.replace(/(^|[_\-\s]+)([a-zA-Z0-9])/g, (_, __, c: string) => c.toUpperCase())
}

/** The migration of one file. */
class Migration {
  readonly reasons: string[] = []
  readonly stats: MigrationStats = { elements: 0, mapped: 0, classAttributes: 0, parts: 0, getters: 0, handlers: 0, bindings: 0, resources: 0 }
  readonly locals = new Map<ts.Node, Local>()
  readonly byName = new Map<string, Local>()
  readonly getters: Getter[] = []
  readonly methods: Method[] = []
  readonly useBody: string[] = []
  readonly parts: Part[] = []
  readonly defaults: Array<{ ns: string; key: string; value: string }> = []
  readonly members = new Set<string>()
  readonly imports = new Set<string>()
  readonly viewsTypes = new Set<string>()
  readonly checker: ts.TypeChecker
  readonly stem: string
  readonly dir: string
  propsType?: string
  propsTypeDecl?: string
  needsMemoize = false
  needsNavigate = false
  /** Getters already made for an expression text (same expression → same getter). */
  readonly gettersByExpr = new Map<string, string>()
  /** State setters used as values: each becomes a method. */
  readonly usedSetters = new Set<Local>()
  /** Local components of the file a ReactHost renders (exported by `X.parts.tsx`). */
  readonly exportedLocals = new Set<string>()
  /** Import lines the code-behind needs besides the TSX's (`Fragment`). */
  readonly extraImports = new Set<string>()
  /** Components defined in the file other than the converted one (used through parts). */
  readonly localComponents = new Set<string>()

  constructor(readonly cfg: MigrateConfig, readonly sf: SourceFile, readonly fn: FnLike, readonly name: string) {
    this.checker = cfg.project.getTypeChecker().compilerObject
    this.stem = basename(sf.getFilePath()).replace(/\.tsx?$/, '')
    this.dir = dirname(sf.getFilePath())
    for (const m of VIEW_MEMBERS) this.members.add(m)
  }

  reason(r: string): void {
    if (!this.reasons.includes(r)) this.reasons.push(r)
  }

  /** A class member name not used yet. */
  member(base: string): string {
    let name = base.replace(/[^A-Za-z0-9_$]/g, '_')
    if (!/^[A-Za-z_$]/.test(name)) name = '_' + name
    if (VIEW_MEMBERS.has(name)) name = name === 't' ? 'tr' : name + '_'
    let n = name
    for (let k = 2; this.members.has(n); k++) n = `${name}${k}`
    this.members.add(n)
    return n
  }

  typeText(node: ts.Node): string | undefined {
    try {
      const type = this.checker.getTypeAtLocation(node)
      // Seen from the file itself: a type it does not import is written `import("…").T`.
      let text = this.checker.typeToString(type, this.sf.compilerNode, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)
      // `import("/abs/path").X` → a path relative to the code-behind.
      text = text.replace(/import\("([^"]+)"\)/g, (_m, p: string) => {
        let rel = relative(this.dir, p).split('\\').join('/')
        if (!rel.startsWith('.')) rel = './' + rel
        return `import(${JSON.stringify(rel)})`
      })
      if (text.includes('typeof ') && /typeof [a-z]/.test(text)) return undefined
      return text
    } catch {
      return undefined
    }
  }

  isFunctionType(node: ts.Node): boolean {
    const type = this.checker.getTypeAtLocation(node)
    return type.getCallSignatures().length > 0 && !(type.flags & ts.TypeFlags.Object && type.getProperties().length > 4)
  }

  isBooleanType(node: ts.Node): boolean {
    const type = this.checker.getTypeAtLocation(node)
    const flags = type.flags
    if (flags & ts.TypeFlags.BooleanLike) return true
    if (type.isUnion()) return type.types.every((t) => !!(t.flags & ts.TypeFlags.BooleanLike))
    return false
  }

  // ── Locals ────────────────────────────────────────────────────────────────

  addLocal(local: Local): void {
    this.locals.set(local.decl, local)
    this.byName.set(local.name, local)
  }

  /** The `Local` a name at `id` refers to (through the checker), if it is one of the component's. */
  localOf(id: ts.Identifier): Local | undefined {
    let sym: ts.Symbol | undefined
    if (ts.isShorthandPropertyAssignment(id.parent) && id.parent.name === id) sym = this.checker.getShorthandAssignmentValueSymbol(id.parent)
    else sym = this.checker.getSymbolAtLocation(id)
    if (!sym) return undefined
    if (sym.flags & ts.SymbolFlags.Alias) return undefined
    for (const d of sym.declarations ?? []) {
      const l = this.locals.get(d)
      if (l) return l
    }
    return undefined
  }

  /**
   * The source of `node` with the component's locals rewritten for the class (`x` → `this.x`, `setX(v)` →
   * `this.x = v`, `t(…)` → `this.tr(…)`), `rows` maps a template's parameters to their row expressions.
   * `inUse`: the code stays in `use()`, where hook locals are still local variables.
   */
  rewrite(node: ts.Node, opts: { inUse?: boolean; rows?: Map<ts.Node, string> } = {}): string {
    const sfText = node.getSourceFile().text
    const start = node.getStart()
    const end = node.getEnd()
    const edits: Array<{ s: number; e: number; text: string }> = []
    const visit = (n: ts.Node): void => {
      // `setX(v)` / `setX(prev => …)` as a statement → an assignment of the state field.
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        const l = this.localOf(n.expression)
        if (l?.kind === 'setter' && l.state && n.arguments.length === 1) {
          const arg = n.arguments[0]
          const field = `this.${l.state}`
          let value: string
          if ((ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) && arg.parameters.length === 1 && ts.isIdentifier(arg.parameters[0].name)) {
            // `setX(prev => expr)`: `prev` is the current value.
            const p = arg.parameters[0]
            const inner = new Map(opts.rows ?? [])
            inner.set(p, field)
            const body = arg.body
            value = ts.isBlock(body) ? `((${(p.name as ts.Identifier).text}) => ${this.rewrite(body, { ...opts, rows: inner })})(${field})` : this.rewrite(body, { ...opts, rows: inner })
            if (!ts.isBlock(body) && ts.isObjectLiteralExpression(skipParens(body))) value = `(${value.replace(/^\((.*)\)$/s, '$1')})`
          } else {
            const t = this.checker.getTypeAtLocation(arg)
            value = t.getCallSignatures().length ? `((v) => (typeof v === 'function' ? v(${field}) : v))(${this.rewrite(arg, opts)})` : this.rewrite(arg, opts)
          }
          // A statement stays a statement (`this.x = v`, no parentheses: the line before has no semicolon); an
          // expression keeps its value (`(this.x = v)`).
          const statement = ts.isExpressionStatement(n.parent) || (ts.isArrowFunction(n.parent) && n.parent.body === n)
          edits.push({ s: n.getStart(), e: n.getEnd(), text: statement ? `${field} = ${value}` : `(${field} = ${value})` })
          return
        }
      }
      // `typeof user` in a type: the member's type, `X['user']` (`typeof this.user` is not allowed everywhere).
      if (ts.isTypeQueryNode(n) && ts.isIdentifier(n.exprName) && !(opts.inUse)) {
        const l = this.localOf(n.exprName)
        if (l) {
          const text = l.kind === 'prop' ? `${this.stem}['props']['${l.member}']` : l.kind === 'props-object' ? `${this.stem}['props']` : `${this.stem}['${l.member}']`
          edits.push({ s: n.getStart(), e: n.getEnd(), text })
          return
        }
      }
      if (ts.isIdentifier(n)) {
        const parent = n.parent
        // Property names, declarations' own names: not references.
        if ((ts.isPropertyAccessExpression(parent) && parent.name === n) || (ts.isPropertyAssignment(parent) && parent.name === n) ||
          (ts.isBindingElement(parent) && parent.propertyName === n) || ts.isJsxAttribute(parent) || (ts.isMethodDeclaration(parent) && parent.name === n)) return
        if (ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxClosingElement(parent)) {
          if (parent.tagName !== n) return
        }
        const rowParam = opts.rows && this.rowParamOf(n, opts.rows)
        if (rowParam !== undefined) {
          const text = ts.isShorthandPropertyAssignment(parent) && parent.name === n ? `${n.text}: ${rowParam}` : rowParam
          edits.push({ s: n.getStart(), e: n.getEnd(), text })
          return
        }
        const l = this.localOf(n)
        if (!l) return
        let text: string
        if (opts.inUse && (l.kind === 'hook-data' || l.kind === 'hook-fn' || l.kind === 'translate')) return
        switch (l.kind) {
          case 'setter':
            // A setter passed as a value: the generated method (`setForm(v)`), bound.
            this.usedSetters.add(l)
            text = `this.${l.member}.bind(this)`
            break
          case 'prop':
            text = `this.props.${l.name}`
            break
          case 'props-object':
            text = 'this.props'
            break
          case 'method': {
            // A method passed as a value keeps its `this`.
            const called = ts.isCallExpression(parent) && parent.expression === n
            text = called ? `this.${l.member}` : `this.${l.member}.bind(this)`
            break
          }
          default:
            text = `this.${l.member}`
        }
        if (ts.isShorthandPropertyAssignment(parent) && parent.name === n) text = `${n.text}: ${text}`
        edits.push({ s: n.getStart(), e: n.getEnd(), text })
        return
      }
      ts.forEachChild(n, visit)
    }
    visit(node)
    edits.sort((a, b) => b.s - a.s)
    let out = sfText.slice(start, end)
    for (const e of edits) out = out.slice(0, e.s - start) + e.text + out.slice(e.e - start)
    return out
  }

  /** The row expression of a template parameter `id` refers to, if any. */
  rowParamOf(id: ts.Identifier, rows: Map<ts.Node, string>): string | undefined {
    const sym = this.checker.getSymbolAtLocation(id)
    for (const d of sym?.declarations ?? []) {
      const r = rows.get(d)
      if (r !== undefined) return r
    }
    return undefined
  }

  /**
   * The members an expression reads (`this.a`, `this.b`): the memo inputs of a getter. Methods are left out (they do
   * not change); fields holding functions (`this.tr`) are inputs (a new language gives a new `t`).
   */
  deps(text: string): string[] {
    const methods = new Set([...this.methods.map((x) => x.name), ...[...this.usedSetters].map((l) => l.member)])
    const deps = new Set<string>()
    for (const m of text.matchAll(/this\.([A-Za-z_$][\w$]*)\b/g)) if (!methods.has(m[1])) deps.add(m[1])
    return [...deps]
  }

  /** A getter for `expr` (in class terms); returns its name. `memo`: it builds an object (memoized on its inputs). */
  getter(base: string, expr: string, opts: { memo?: boolean; doc?: string; type?: string; guards?: string[] } = {}): string {
    const key = (opts.guards?.length ? opts.guards.join(' && ') + ' => ' : '') + expr
    const known = this.gettersByExpr.get(key)
    if (known) return known
    const name = this.member(base)
    this.getters.push({ name, body: expr, memo: !!opts.memo, doc: opts.doc, type: opts.type, guards: opts.guards?.length ? [...opts.guards] : undefined })
    this.gettersByExpr.set(key, name)
    this.stats.getters++
    return name
  }

  /** Whether the value of `node` is an object (a getter returning it must memoize; strings, numbers, booleans need not). */
  isObjectValue(node: ts.Node): boolean {
    try {
      const t = this.checker.getTypeAtLocation(node)
      const prim = ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void | ts.TypeFlags.BigIntLike
      const parts = t.isUnion() ? t.types : [t]
      return parts.some((p) => !(p.flags & prim))
    } catch {
      return Migration.buildsObject(node)
    }
  }

  /** Whether an expression builds a new object / array / function each time (a getter returning it must memoize). */
  static buildsObject(node: ts.Node): boolean {
    const e = skipParens(node)
    if (ts.isObjectLiteralExpression(e) || ts.isArrayLiteralExpression(e) || ts.isArrowFunction(e) || ts.isFunctionExpression(e) || ts.isNewExpression(e) || ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e)) return true
    if (ts.isCallExpression(e)) return true
    if (ts.isConditionalExpression(e)) return Migration.buildsObject(e.whenTrue) || Migration.buildsObject(e.whenFalse)
    if (ts.isBinaryExpression(e) && (e.operatorToken.kind === ts.SyntaxKind.BarBarToken || e.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken || e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)) {
      return Migration.buildsObject(e.left) || Migration.buildsObject(e.right)
    }
    return false
  }
}

function skipParens(n: ts.Node): ts.Node {
  let e = n
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e)) e = e.expression
  return e
}

// ── Finding the component ────────────────────────────────────────────────────

interface FoundComponent {
  name: string
  fn: FnLike
  exported: 'named' | 'default' | 'both'
}

function returnsJsx(fn: Node): boolean {
  let found = false
  fn.forEachDescendant((d, t) => {
    if (Node.isFunctionDeclaration(d) || Node.isArrowFunction(d) || Node.isFunctionExpression(d)) {
      if (d !== fn) t.skip()
      return
    }
    if (Node.isReturnStatement(d)) {
      const e = d.getExpression()
      if (e && (Node.isJsxElement(skip(e)) || Node.isJsxSelfClosingElement(skip(e)) || Node.isJsxFragment(skip(e)) || Node.isParenthesizedExpression(e))) found = true
    }
  })
  if (Node.isArrowFunction(fn)) {
    const b = fn.getBody()
    if (Node.isJsxElement(skip(b)) || Node.isJsxSelfClosingElement(skip(b)) || Node.isJsxFragment(skip(b))) found = true
  }
  return found
}

function skip(n: Node): Node {
  let e = n
  while (Node.isParenthesizedExpression(e)) e = e.getExpression()
  return e
}

/** Every PascalCase function component of the file, the exported ones flagged. */
export function componentsOf(sf: SourceFile): Array<FoundComponent & { exportedAt: boolean }> {
  const out: Array<FoundComponent & { exportedAt: boolean }> = []
  for (const f of sf.getFunctions()) {
    const name = f.getName()
    if (!name || !/^[A-Z]/.test(name) || !returnsJsx(f)) continue
    const isDefault = f.isDefaultExport()
    out.push({ name, fn: f as unknown as FnLike, exported: isDefault ? 'default' : 'named', exportedAt: f.isExported() })
  }
  for (const v of sf.getVariableDeclarations()) {
    const init = v.getInitializer()
    const name = v.getName()
    if (!init || !/^[A-Z]/.test(name)) continue
    if (!(Node.isArrowFunction(init) || Node.isFunctionExpression(init)) || !returnsJsx(init)) continue
    const stmt = v.getVariableStatement()
    out.push({ name, fn: init as unknown as FnLike, exported: 'named', exportedAt: !!stmt?.isExported() })
  }
  // `export default X` of a local component.
  const def = sf.getExportAssignment((e) => !e.isExportEquals())
  if (def) {
    const e = def.getExpression()
    if (Node.isIdentifier(e)) {
      const c = out.find((o) => o.name === e.getText())
      if (c) {
        c.exported = c.exportedAt ? 'both' : 'default'
        c.exportedAt = true
      }
    }
  }
  return out
}

// ── The migration of the component's body ───────────────────────────────────

function isHookCall(e: ts.Node | undefined): boolean {
  if (!e) return false
  const x = skipParens(e)
  if (ts.isAwaitExpression(x)) return false
  if (!ts.isCallExpression(x)) return false
  const callee = x.expression
  if (ts.isIdentifier(callee)) return HOOK.test(callee.text)
  if (ts.isPropertyAccessExpression(callee)) return HOOK.test(callee.name.text)
  return false
}

/** Names declared by a binding pattern / identifier, with their declaration nodes. */
function declaredNames(name: ts.BindingName): Array<{ name: string; decl: ts.Node }> {
  if (ts.isIdentifier(name)) return [{ name: name.text, decl: name.parent }]
  const out: Array<{ name: string; decl: ts.Node }> = []
  for (const el of name.elements) {
    if (ts.isOmittedExpression(el)) continue
    if (ts.isIdentifier(el.name)) out.push({ name: el.name.text, decl: el })
    else out.push(...declaredNames(el.name))
  }
  return out
}

function staticInit(e: ts.Node): boolean {
  let ok = true
  const visit = (n: ts.Node): void => {
    if (!ok) return
    if (ts.isIdentifier(n)) {
      const p = n.parent
      if ((ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n)) return
      if (['undefined', 'null', 'true', 'false', 'NaN', 'Infinity'].includes(n.text)) return
      ok = false
      return
    }
    if (ts.isCallExpression(n) || ts.isNewExpression(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
      ok = false
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(e)
  return ok
}

export function migrateFile(cfg: MigrateConfig, sf: SourceFile, wanted?: string): MigrationResult {
  const file = sf.getFilePath()
  const result: MigrationResult = {
    file,
    status: 'skipped',
    reasons: [],
    stats: { elements: 0, mapped: 0, classAttributes: 0, parts: 0, getters: 0, handlers: 0, bindings: 0, resources: 0 },
    outputs: {},
    deletes: [],
    edits: {},
    defaults: [],
  }
  const comps = componentsOf(sf)
  const stem = basename(file).replace(/\.tsx?$/, '')
  const exported = comps.filter((c) => c.exportedAt)
  const target = (wanted ? comps.find((c) => c.name === wanted) : undefined) ?? exported.find((c) => c.name === stem) ?? (exported.length === 1 ? exported[0] : undefined)
  if (!target) {
    result.reasons.push(exported.length ? `several exported components (${exported.map((c) => c.name).join(', ')}): name one` : 'no exported function component')
    return result
  }
  result.component = target.name
  if (exported.length > 1) {
    result.reasons.push(`the file also exports ${exported.filter((c) => c !== target).map((c) => c.name).join(', ')}: they stay in X.parts.tsx`)
  }
  const m = new Migration(cfg, sf, target.fn, target.name)
  for (const c of comps) if (c !== target) m.localComponents.add(c.name)
  try {
    const out = convert(m, target)
    result.outputs = out.outputs
    result.edits = out.edits
    // The .tsx goes, unless the code-behind took its very name (a code-behind with JSX is a .tsx).
    result.deletes = out.outputs[file] === undefined ? [file] : []
  } catch (e) {
    result.reasons.push(...m.reasons, `stopped: ${(e as Error).message}`)
    result.stats = m.stats
    return result
  }
  result.reasons.push(...m.reasons)
  result.stats = m.stats
  result.defaults = m.defaults
  result.status = m.stats.parts > 0 || m.reasons.length > 0 ? 'partial' : 'converted'
  return result
}

class Stop extends Error {}

/** An element that cannot be converted: the caller rolls back what it started and cuts it out as a part. */
class NeedsPart extends Error {}

interface Snapshot {
  getters: number
  methods: number
  reasons: number
  defaults: number
  members: Set<string>
  usedSetters: Set<Local>
  viewsTypes: Set<string>
  exportedLocals: Set<string>
  extraImports: Set<string>
  gettersByExpr: Map<string, string>
  stats: MigrationStats
  needsNavigate: boolean
  rowFields?: Map<string, string>
}

function snapshot(m: Migration, ctx: JsxCtx): Snapshot {
  return {
    getters: m.getters.length, methods: m.methods.length, reasons: m.reasons.length, defaults: m.defaults.length,
    members: new Set(m.members), usedSetters: new Set(m.usedSetters), viewsTypes: new Set(m.viewsTypes),
    exportedLocals: new Set(m.exportedLocals), extraImports: new Set(m.extraImports), gettersByExpr: new Map(m.gettersByExpr), stats: { ...m.stats },
    needsNavigate: m.needsNavigate, rowFields: ctx.row ? new Map(ctx.row.fields) : undefined,
  }
}

function rollback(m: Migration, s: Snapshot, ctx: JsxCtx): void {
  m.getters.length = s.getters
  m.methods.length = s.methods
  m.reasons.length = s.reasons
  m.defaults.length = s.defaults
  const reset = <T>(target: Set<T>, from: Set<T>): void => {
    target.clear()
    for (const x of from) target.add(x)
  }
  reset(m.members, s.members)
  reset(m.usedSetters, s.usedSetters)
  reset(m.viewsTypes, s.viewsTypes)
  reset(m.exportedLocals, s.exportedLocals)
  reset(m.extraImports, s.extraImports)
  m.gettersByExpr.clear()
  for (const [k, v] of s.gettersByExpr) m.gettersByExpr.set(k, v)
  Object.assign(m.stats, s.stats)
  m.needsNavigate = s.needsNavigate
  if (ctx.row && s.rowFields) {
    ctx.row.fields.clear()
    for (const [k, v] of s.rowFields) ctx.row.fields.set(k, v)
  }
}

function convert(m: Migration, target: FoundComponent): { outputs: Record<string, string>; edits: Record<string, string> } {
  const fn = target.fn.compilerNode as unknown as ts.FunctionLikeDeclaration
  // ── Props ──
  const p0 = fn.parameters[0]
  if (p0) {
    if (ts.isObjectBindingPattern(p0.name)) {
      for (const el of p0.name.elements) {
        if (!ts.isIdentifier(el.name) || el.dotDotDotToken) throw new Stop('props destructured with a rest element or nested pattern')
        const propName = (el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : el.name.text)
        if (el.initializer) {
          // `{ a = 1 }`: a getter applying the default.
          const g = m.member(el.name.text)
          m.addLocal({ name: el.name.text, kind: 'derived', member: g, decl: el })
          m.getters.push({ name: g, body: `this.props.${propName} ?? ${el.initializer.getText()}`, memo: false })
        } else {
          m.addLocal({ name: el.name.text, kind: 'prop', member: propName, decl: el })
        }
      }
    } else if (ts.isIdentifier(p0.name)) {
      m.addLocal({ name: p0.name.text, kind: 'props-object', member: 'props', decl: p0 })
    }
    const t = p0.type
    if (t) {
      if (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)) m.propsType = t.typeName.text
      else m.propsTypeDecl = t.getText()
      if (!m.propsType) m.propsType = `${target.name}Props`
    }
  }

  // ── Body ──
  const body = fn.body
  if (!body) throw new Stop('no body')
  let jsx: ts.Expression
  const statements: ts.Statement[] = []
  if (ts.isBlock(body)) {
    const last = body.statements[body.statements.length - 1]
    if (!last || !ts.isReturnStatement(last) || !last.expression) throw new Stop('the body does not end with `return <jsx>`')
    jsx = last.expression
    statements.push(...body.statements.slice(0, -1))
  } else {
    jsx = body
  }
  // `if (cond) return <A/>` before the main JSX: alternative screens, each shown when its condition holds and none of
  // the earlier ones did (the main screen when none holds).
  const branches: Array<{ cond: ts.Expression; jsx: ts.Expression }> = []
  const branchesBefore = new Map<ts.Statement, number>()
  for (let k = 0; k < statements.length; k++) {
    const s = statements[k]
    if (ts.isIfStatement(s) && !s.elseStatement) {
      const then = ts.isBlock(s.thenStatement) && s.thenStatement.statements.length === 1 ? s.thenStatement.statements[0] : s.thenStatement
      if (ts.isReturnStatement(then) && then.expression) {
        branches.push({ cond: s.expression, jsx: then.expression })
        // The statements after it ran only when it did not return.
        for (const later of statements.slice(k + 1)) branchesBefore.set(later, branches.length)
        statements.splice(k--, 1)
        continue
      }
    }
    let early = false
    const find = (n: ts.Node): void => {
      if (ts.isFunctionLike(n)) return
      if (ts.isReturnStatement(n)) early = true
      ts.forEachChild(n, find)
    }
    ts.forEachChild(s, find)
    if (early) throw new Stop('a `return` inside a statement of the component body (not a plain `if (cond) return <jsx>`): convert by hand')
  }

  // Pass 1: declare the locals.
  const pending: Array<() => void> = []
  for (const s of statements) {
    if (ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        const init = d.initializer
        // useState
        if (init && ts.isCallExpression(skipParens(init)) && isHookCall(init) && /^useState$/.test(((skipParens(init) as ts.CallExpression).expression as ts.Identifier).text ?? '') && ts.isArrayBindingPattern(d.name)) {
          const call = skipParens(init) as ts.CallExpression
          const [v, set] = d.name.elements
          if (!v || ts.isOmittedExpression(v) || !ts.isIdentifier(v.name)) throw new Stop('useState without a value name')
          const arg = call.arguments[0]
          const member = m.member(v.name.text)
          const typeArg = call.typeArguments?.[0]?.getText()
          const isStatic = !arg || staticInit(arg)
          const type = typeArg
          if (isStatic) {
            m.addLocal({ name: v.name.text, kind: 'state', member, decl: v, type, init: arg ? arg.getText() : 'undefined' })
            if (set && !ts.isOmittedExpression(set) && ts.isIdentifier(set.name)) {
              const setter = m.member(set.name.text)
              m.addLocal({ name: set.name.text, kind: 'setter', member: setter, state: member, decl: set })
            }
          } else {
            // A computed initial value: React keeps the state; the field mirrors it (`use()` assigns it).
            m.addLocal({ name: v.name.text, kind: 'hook-data', member, decl: v, type })
            if (set && !ts.isOmittedExpression(set) && ts.isIdentifier(set.name)) {
              m.addLocal({ name: set.name.text, kind: 'hook-fn', member: m.member(set.name.text), decl: set, type: m.typeText(set) })
            }
            // Its type written out when it can be (the hooks type would otherwise depend on itself through the getters
            // the initial value reads).
            const written = typeArg ?? printableType(m, v)
            pending.push(() => m.useBody.push(typeArg || !written ? m.rewrite(s, { inUse: true }) : m.rewrite(s, { inUse: true }).replace(/\buseState\(/, `useState<${written}>(`)))
          }
          continue
        }
        if (init && isHookCall(init)) {
          const callee = (skipParens(init) as ts.CallExpression).expression
          const hookName = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : ''
          for (const n of declaredNames(d.name)) {
            if (hookName === 'useTranslation' && n.name === 't') {
              const nsArg = (skipParens(init) as ts.CallExpression).arguments[0]
              const ns = nsArg && ts.isStringLiteral(nsArg) ? nsArg.text : undefined
              m.addLocal({ name: n.name, kind: 'translate', member: m.member('tr'), decl: n.decl, ns })
              continue
            }
            const isFn = m.isFunctionType(n.decl)
            m.addLocal({ name: n.name, kind: isFn ? 'hook-fn' : 'hook-data', member: m.member(n.name), decl: n.decl, type: m.typeText(n.decl) })
          }
          pending.push(() => m.useBody.push(m.rewrite(s, { inUse: true })))
          continue
        }
        if (init && (ts.isArrowFunction(skipParens(init)) || ts.isFunctionExpression(skipParens(init))) && ts.isIdentifier(d.name)) {
          m.addLocal({ name: d.name.text, kind: 'method', member: m.member(d.name.text), decl: d })
          continue
        }
        if (init && ts.isIdentifier(d.name)) {
          m.addLocal({ name: d.name.text, kind: 'derived', member: m.member(d.name.text), decl: d, type: d.type ? d.type.getText() : undefined })
          continue
        }
        if (init && !ts.isIdentifier(d.name)) {
          // `const { a, b } = expr` (not a hook): each name a getter reading the destructured expression.
          for (const n of declaredNames(d.name)) m.addLocal({ name: n.name, kind: 'derived', member: m.member(n.name), decl: n.decl, type: m.typeText(n.decl) })
          continue
        }
        throw new Stop(`\`${d.getText()}\`: a declaration without a value`)
      }
      if (!(s.declarationList.flags & ts.NodeFlags.Const)) m.reason('a `let` in the component body became a getter/field: check that it is never reassigned')
      continue
    }
    if (ts.isFunctionDeclaration(s) && s.name) {
      m.addLocal({ name: s.name.text, kind: 'method', member: m.member(s.name.text), decl: s })
      continue
    }
    if (ts.isExpressionStatement(s) && isHookCall(s.expression)) {
      pending.push(() => m.useBody.push(m.rewrite(s, { inUse: true })))
      continue
    }
    throw new Stop(`unsupported statement in the component body: \`${s.getText().slice(0, 60)}…\``)
  }

  // Pass 2: fill in `use()`, the getters and the methods, now that every local is known.
  // A constant declared after an early return was only computed when it did not return: its getter is guarded alike.
  const branchConds = branches.map((b) => m.rewrite(b.cond))
  const guardsOf = (decl: ts.Node): string[] | undefined => {
    let st: ts.Node | undefined = decl
    while (st && !ts.isVariableStatement(st)) st = st.parent
    const n = st ? branchesBefore.get(st as ts.Statement) ?? 0 : 0
    return n ? branchConds.slice(0, n).map((c) => `!(${c})`) : undefined
  }
  for (const p of pending) p()
  for (const l of [...m.locals.values()]) {
    if (l.kind === 'derived' && ts.isVariableDeclaration(l.decl) && l.decl.initializer) {
      const init = l.decl.initializer
      if (ts.isIdentifier(l.decl.name)) {
        const body = m.rewrite(init)
        m.getters.push({ name: l.member, body, memo: m.isObjectValue(init), type: l.type, guards: guardsOf(l.decl) })
        m.stats.getters++
      }
    } else if (l.kind === 'derived' && ts.isBindingElement(l.decl)) {
      // Destructured: read the property of the destructured expression.
      let decl: ts.Node = l.decl
      const path: string[] = []
      while (ts.isBindingElement(decl)) {
        const el = decl as ts.BindingElement
        const key = el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : ts.isIdentifier(el.name) ? el.name.text : ''
        if (ts.isArrayBindingPattern(el.parent)) path.unshift(`[${el.parent.elements.indexOf(el)}]`)
        else path.unshift(`.${key}`)
        decl = el.parent.parent
      }
      if (ts.isVariableDeclaration(decl) && decl.initializer) {
        const src = m.rewrite(decl.initializer)
        m.getters.push({ name: l.member, body: `(${src})${path.join("")}`, memo: m.isObjectValue(l.decl), guards: guardsOf(decl) })
        m.stats.getters++
      }
    } else if (l.kind === 'method') {
      const d = l.decl
      let f: ts.FunctionLikeDeclaration | undefined
      if (ts.isVariableDeclaration(d) && d.initializer) f = skipParens(d.initializer) as ts.FunctionLikeDeclaration
      else if (ts.isFunctionDeclaration(d)) f = d
      if (!f || !f.body) continue
      const params = f.parameters.map((p) => m.rewrite(p)).join(', ')
      const isAsync = !!f.modifiers?.some((x) => x.kind === ts.SyntaxKind.AsyncKeyword)
      const b = ts.isBlock(f.body) ? m.rewrite(f.body) : `{\n    return ${m.rewrite(f.body)}\n  }`
      const typeParams = f.typeParameters?.length ? `<${f.typeParameters.map((t) => m.rewrite(t)).join(', ')}>` : undefined
      m.methods.push({ name: l.member, params, body: b, async: isAsync, typeParams })
    }
  }
  // Hook results land in fields at the end of `use()`.

  // ── The markup ──
  let root: XNode
  if (!branches.length) root = convertRoot(m, jsx)
  else {
    // A layout-neutral root holding every alternative, each with its Visible condition.
    root = { el: 'Panel', attrs: [{ name: 'Class', value: 'contents' }], children: [] }
    const earlier: string[] = []
    const show = (own: string | undefined, base: string): string => {
      const parts = [...earlier.map((c) => `!(${c})`), ...(own ? [`!!(${own})`] : [])]
      return `{Binding ${m.getter(base, parts.join(' && ') || 'true')}}`
    }
    branches.forEach((b, k) => {
      const cond = m.rewrite(b.cond)
      const vis = show(cond, `show_case_${k + 1}`)
      for (const n of convertBranch(m, b.jsx, { guards: [...earlier.map((c) => `!(${c})`), cond] })) root.children.push(withVisible(m, n, vis, {}))
      earlier.push(cond)
    })
    const vis = show(undefined, 'show_main')
    for (const n of convertBranch(m, jsx, { guards: earlier.map((c) => `!(${c})`) })) root.children.push(withVisible(m, n, vis, {}))
    m.stats.classAttributes++
  }
  if (m.propsType) attr(root, 'x:Props', m.propsType)
  dropDefaults(m, root)

  // ── Outputs ──
  const viewFile = join(m.dir, `${m.stem}.kbview`)
  // A code-behind holding JSX (a derived element, a handler building one) is a `.tsx`.
  const hasJsx = [...m.useBody, ...m.getters.map((g) => g.body), ...m.methods.map((x) => x.body)].some(containsJsxText)
  const codeFile = join(m.dir, `${m.stem}.${hasJsx ? 'tsx' : 'ts'}`)
  const outputs: Record<string, string> = {}
  outputs[viewFile] = writeXml(root, `${m.name} — converted from ${m.stem}.tsx by @kubuno/views-migrate${m.reasons.length ? ' (partial: see the TODO comments and the report)' : ''}.`)
  outputs[codeFile] = codeBehind(m, target, outputs[viewFile])
  if (m.parts.length || m.exportedLocals.size) outputs[join(m.dir, `${m.stem}.parts.tsx`)] = partsFile(m)
  const edits: Record<string, string> = {}
  return { outputs, edits }
}

// ── JSX → markup ────────────────────────────────────────────────────────────

interface JsxCtx {
  /** The innermost Repeater scope. */
  row?: RowScope
  /** Template parameters → row expressions (`e.row.x`) for code-behind rewriting inside templates. */
  rows?: Map<ts.Node, string>
  /** The parent intrinsic element's classes (a `Label` inside a flex box stays a block). */
  parentFlex?: boolean
  /** The conditions the subtree is shown under (`cond && <X/>`, an early return): its getters are read only then. */
  guards?: string[]
}

function convertRoot(m: Migration, expr: ts.Expression): XNode {
  const e = skipParens(expr)
  const nodes = convertChild(m, e, {})
  if (nodes.length === 1) return nodes[0]
  // A fragment of several elements: a layout-neutral root.
  return { el: 'Panel', attrs: [{ name: 'Class', value: 'contents' }], children: nodes }
}

/** The value of an expression as an attribute value: a literal, a `{Res}`, a `{Binding}` (a getter if needed). */
function valueOf(m: Migration, e: ts.Expression, ctx: JsxCtx, base: string, kind: 'text' | 'bool' | 'any' = 'any'): string {
  const x = skipParens(e)
  if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) {
    if (isSafeLiteral(x.text)) return x.text
  }
  if (ts.isNumericLiteral(x)) return x.text
  if (x.kind === ts.SyntaxKind.TrueKeyword) return 'true'
  if (x.kind === ts.SyntaxKind.FalseKeyword) return 'false'
  const res = resOf(m, x, ctx)
  if (res) return res
  // A plain member path on a field or the row (`error`, `form.name`, `theme.name`).
  const path = pathOf(m, x, ctx)
  if (path && (kind !== 'bool' || m.isBooleanType(x))) {
    m.stats.bindings++
    return `{Binding ${path}}`
  }
  let text = m.rewrite(x, { rows: ctx.rows })
  if (kind === 'bool' && !m.isBooleanType(x)) text = `!!(${text})`
  return binding(m, x, text, ctx, base)
}

/** A `{Binding}` to a getter (page) or a row field (template) computing `text`. */
function binding(m: Migration, node: ts.Node, text: string, ctx: JsxCtx, base: string): string {
  m.stats.bindings++
  if (ctx.row && /\b__row\b/.test(text)) {
    // A row field (the rows getter computes it).
    let name = snake(base) || 'value'
    for (let k = 2; ctx.row.fields.has(name); k++) name = `${snake(base)}${k}`
    // Under a condition, the row field is computed only when it holds (the TSX did not evaluate it otherwise).
    const guards = ctx.guards ?? []
    ctx.row.fields.set(name, guards.length ? `(${guards.map((g) => `(${g})`).join(' && ')}) ? (${text}) : undefined` : text)
    return `{Binding ${name}}`
  }
  const g = m.getter(snake(base) || 'value', text, { memo: m.isObjectValue(node), guards: (ctx.guards ?? []).filter((c) => !/__row/.test(c)) })
  return `{Binding ${g}}`
}

/** `a.b.c` relative to the view (a field) or the row (a template parameter), when `e` is such a plain path. */
function pathOf(m: Migration, e: ts.Node, ctx: JsxCtx): string | undefined {
  const segs: string[] = []
  let x = skipParens(e)
  while (ts.isPropertyAccessExpression(x) && !x.questionDotToken) {
    segs.unshift(x.name.text)
    x = skipParens(x.expression)
  }
  if (!ts.isIdentifier(x)) return undefined
  if (ctx.rows) {
    const r = m.rowParamOf(x, ctx.rows)
    if (r !== undefined) {
      // `__row.theme` → the row field `theme`.
      const name = r.replace(/^__row\./, '')
      if (!/^[A-Za-z_$][\w$]*$/.test(name)) return undefined
      return [name, ...segs].join('.')
    }
  }
  const l = m.localOf(x)
  if (!l) return undefined
  if (l.kind === 'state' || l.kind === 'hook-data' || l.kind === 'derived') return [l.member, ...segs].join('.')
  if (l.kind === 'prop') return ['props', l.member, ...segs].join('.')
  if (l.kind === 'props-object') return ['props', ...segs].join('.')
  return undefined
}

/** `t('key')`, `t('key', { defaultValue, count, x })` with the component's `t` → `{Res key[, Source=ns][, Args]}`. */
function resOf(m: Migration, e: ts.Node, ctx: JsxCtx): string | undefined {
  if (!ts.isCallExpression(e) || !ts.isIdentifier(e.expression)) return undefined
  const l = m.localOf(e.expression)
  if (l?.kind !== 'translate') return undefined
  const [k, opts] = e.arguments
  if (!k || !(ts.isStringLiteral(k) || ts.isNoSubstitutionTemplateLiteral(k))) return undefined
  let key = k.text
  let ns = l.ns
  const colon = key.indexOf(':')
  if (colon > 0 && !key.slice(0, colon).includes('.')) {
    ns = key.slice(0, colon)
    key = key.slice(colon + 1)
  }
  const args: string[] = []
  let defaultValue: string | undefined
  if (opts) {
    if (!ts.isObjectLiteralExpression(opts)) return undefined
    for (const p of opts.properties) {
      let name: string
      let value: ts.Expression
      if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
        name = p.name.text
        value = p.initializer
      } else if (ts.isShorthandPropertyAssignment(p)) {
        name = p.name.text
        value = p.name
      } else return undefined
      if (name === 'defaultValue') {
        if (!(ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))) return undefined
        defaultValue = value.text
        continue
      }
      if (['ns', 'lng', 'context', 'returnObjects'].includes(name)) return undefined
      const argName = name === 'count' ? 'Count' : name.charAt(0).toUpperCase() + name.slice(1)
      const x = skipParens(value)
      if (ts.isStringLiteral(x) || ts.isNumericLiteral(x)) {
        if (/[,{}'"]/.test(x.text)) return undefined
        args.push(`${argName}=${x.text}`)
      } else {
        const path = pathOf(m, x, ctx)
        if (path) args.push(`${argName}={Binding ${path}}`)
        else {
          const inner = binding(m, x, m.rewrite(x, { rows: ctx.rows }), ctx, `${key.split('.').pop()}_${name}`)
          args.push(`${argName}=${inner}`)
        }
      }
    }
  }
  const effectiveNs = ns ?? m.cfg.defaultNs
  if (!m.cfg.hasKey(effectiveNs, key)) {
    if (defaultValue === undefined) m.reason(`\`${key}\` is in no ${effectiveNs} bundle and has no defaultValue: the view shows the key, like the TSX did`)
    else m.defaults.push({ ns: effectiveNs, key, value: defaultValue })
  }
  m.stats.resources++
  const parts = [`Res ${key}`]
  if (ns && ns !== m.cfg.defaultNs) parts.push(`Source=${ns}`)
  parts.push(...args)
  return `{${parts.join(', ')}}`
}

/** One JSX child → markup nodes (none for whitespace, several for a fragment). */
function convertChild(m: Migration, e: ts.Node, ctx: JsxCtx): XNode[] {
  const x = skipParens(e)
  if (ts.isJsxText(x)) {
    const text = decodeEntities(cleanJsxText(x.text))
    if (!text) return []
    return [textRun(m, text, ctx)]
  }
  if (ts.isJsxExpression(x)) {
    if (!x.expression) return []
    return convertChild(m, x.expression, ctx)
  }
  if (ts.isJsxFragment(x)) return x.children.flatMap((c) => convertChild(m, c, ctx))
  if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x)) return [convertElement(m, x, ctx)]
  // `cond && <X/>`
  if (ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && isJsxLike(x.right)) {
    const vis = valueOf(m, x.left, ctx, nameFor(x.left, 'show'), 'bool')
    const cond = m.rewrite(x.left, { rows: ctx.rows })
    return convertChild(m, x.right, guarded(ctx, cond)).map((n) => withVisible(m, n, vis, ctx))
  }
  // `cond ? <A/> : <B/>` (either side may be null)
  if (ts.isConditionalExpression(x) && (isJsxLike(x.whenTrue) || isJsxLike(x.whenFalse))) {
    const yes = valueOf(m, x.condition, ctx, nameFor(x.condition, 'show'), 'bool')
    const condText = m.rewrite(x.condition, { rows: ctx.rows })
    const no = binding(m, x.condition, `!(${condText})`, ctx, nameFor(x.condition, 'show_not'))
    return [
      ...convertBranch(m, x.whenTrue, guarded(ctx, condText)).map((n) => withVisible(m, n, yes, ctx)),
      ...convertBranch(m, x.whenFalse, guarded(ctx, `!(${condText})`)).map((n) => withVisible(m, n, no, ctx)),
    ]
  }
  // `list.map((item) => <X/>)`
  if (ts.isCallExpression(x) && ts.isPropertyAccessExpression(x.expression) && x.expression.name.text === 'map') {
    const cb = x.arguments[0]
    if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb))) return [repeater(m, x.expression.expression, cb, ctx, x)]
  }
  // Text-valued expression (a string, a number, a `t()`): a text run.
  return [textRun(m, undefined, ctx, x as ts.Expression)]
}

function convertBranch(m: Migration, e: ts.Expression, ctx: JsxCtx): XNode[] {
  const x = skipParens(e)
  if (x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === 'undefined') || x.kind === ts.SyntaxKind.FalseKeyword) return []
  if (ts.isStringLiteral(x) && x.text === '') return []
  return convertChild(m, x, ctx)
}

function isJsxLike(e: ts.Node): boolean {
  const x = skipParens(e)
  if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x)) return true
  if (ts.isConditionalExpression(x)) return isJsxLike(x.whenTrue) || isJsxLike(x.whenFalse)
  if (x.kind === ts.SyntaxKind.NullKeyword) return false
  return false
}

function withVisible(m: Migration, n: XNode, value: string, ctx: JsxCtx): XNode {
  const existing = n.attrs.find((a) => a.name === 'Visible')
  if (!existing) {
    attr(n, 'Visible', value)
    return n
  }
  // Nested conditions: both must hold.
  const a = existing.value.replace(/^\{Binding (.*)\}$/, '$1')
  const b = value.replace(/^\{Binding (.*)\}$/, '$1')
  const ref = (p: string): string => (ctx.row && ctx.row.fields.has(p) ? `__row.${p}` : `this.${p}`)
  const g = binding(m, ts.factory.createTrue(), `${ref(a)} && ${ref(b)}`, ctx, 'visible')
  attr(n, 'Visible', g)
  return n
}

/** A run of text (JSX text or a text-valued expression) on its own: a `<span>` `Label`. */
function textRun(m: Migration, text: string | undefined, ctx: JsxCtx, expr?: ts.Expression): XNode {
  m.stats.elements++
  // An expression holding elements (`{icon}`, a derived `<Badge/>`): rendered as it is, through a Fragment.
  if (expr && !isTextValue(m, expr) && !resText(m, expr, ctx)) {
    m.stats.parts++
    m.reason('an expression child holding elements (rendered through a ReactHost Fragment)')
    m.extraImports.add("import { Fragment } from 'react'")
    const comp = m.getter('Fragment', 'Fragment', { doc: '`React.Fragment`: renders the elements an expression holds.' })
    const n: XNode = { el: 'ReactHost', attrs: [], children: [], comment: 'TODO(views-migrate): elements held in an expression' }
    attr(n, 'Component', `{Binding ${comp}}`)
    attr(n, 'Props', binding(m, ts.factory.createObjectLiteralExpression(), `{ children: ${m.rewrite(expr, { rows: ctx.rows })} }`, ctx, nameFor(expr, 'content')))
    return n
  }
  m.stats.mapped++
  const n: XNode = { el: 'Label', attrs: [], children: [] }
  attr(n, 'HtmlTag', 'Span')
  attr(n, 'InheritFontSize', 'true')
  attr(n, 'Overflow', 'Wrap')
  attr(n, 'Text', text !== undefined ? (isSafeLiteral(text) ? text : `{Binding ${m.getter('text', JSON.stringify(text))}}`) : valueOf(m, expr!, ctx, 'text', 'text'))
  return n
}

function tagName(e: JsxElement | JsxSelfClosingElement | ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxTagNameExpression {
  return ts.isJsxElement(e as ts.Node) ? (e as ts.JsxElement).openingElement.tagName : (e as ts.JsxSelfClosingElement).tagName
}
function attributesOf(e: ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxAttributes {
  return ts.isJsxElement(e) ? e.openingElement.attributes : e.attributes
}
function childrenOf(e: ts.JsxElement | ts.JsxSelfClosingElement): readonly ts.JsxChild[] {
  return ts.isJsxElement(e) ? e.children : []
}

/** Whether the element's children are only text and text-valued expressions (no elements). */
function textOnly(children: readonly ts.JsxChild[], m?: Migration): boolean {
  // An expression holding elements (`{icon}`) is no text, even without JSX syntax.
  return children.every((c) => ts.isJsxText(c) || (ts.isJsxExpression(c) && (!c.expression || (!containsJsx(c.expression) && (!m || isTextValue(m, c.expression) || !!resText(m, c.expression, {}))))))
}
function containsJsx(n: ts.Node): boolean {
  let found = false
  const v = (x: ts.Node): void => {
    if (found) return
    if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x)) {
      found = true
      return
    }
    ts.forEachChild(x, v)
  }
  v(n)
  return found
}

/** The text of text-only children as one attribute value. */
function textValue(m: Migration, children: readonly ts.JsxChild[], ctx: JsxCtx, base: string): string {
  const parts: Array<{ text?: string; expr?: ts.Expression }> = []
  for (const c of children) {
    if (ts.isJsxText(c)) {
      const t = decodeEntities(cleanJsxText(c.text))
      if (t) parts.push({ text: t })
    } else if (ts.isJsxExpression(c) && c.expression) parts.push({ expr: c.expression })
  }
  if (parts.length === 0) return ''
  if (parts.length === 1) {
    const p = parts[0]
    if (p.text !== undefined) return isSafeLiteral(p.text) ? p.text : `{Binding ${m.getter(base, JSON.stringify(p.text))}}`
    return valueOf(m, p.expr!, ctx, base, 'text')
  }
  // Several runs: one string built by a getter (the `{Res}` parts read through `this.t`).
  const pieces = parts.map((p) => (p.text !== undefined ? JSON.stringify(p.text) : `String(${resText(m, p.expr!, ctx) ?? m.rewrite(p.expr!, { rows: ctx.rows })} ?? '')`))
  return binding(m, children[0], pieces.join(' + '), ctx, base)
}

/** `t('k', …)` as an expression of the class (`this.tr('k', …)`), keeping i18next's behaviour. */
function resText(m: Migration, e: ts.Expression, ctx: JsxCtx): string | undefined {
  const x = skipParens(e)
  if (!ts.isCallExpression(x) || !ts.isIdentifier(x.expression)) return undefined
  const l = m.localOf(x.expression)
  if (l?.kind !== 'translate') return undefined
  return m.rewrite(x, { rows: ctx.rows })
}

function jsxAttr(e: ts.JsxElement | ts.JsxSelfClosingElement, name: string): ts.JsxAttribute | undefined {
  return attributesOf(e).properties.find((p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText() === name)
}

function staticString(a: ts.JsxAttribute | undefined): string | undefined {
  if (!a) return undefined
  const init = a.initializer
  if (!init) return 'true'
  if (ts.isStringLiteral(init)) return init.text
  if (ts.isJsxExpression(init) && init.expression) {
    const x = skipParens(init.expression)
    if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) return x.text
  }
  return undefined
}

/** The class string of `className`: static, or `undefined` when computed. */
function classValue(a: ts.JsxAttribute | undefined): string | undefined {
  const s = staticString(a)
  return s === undefined ? undefined : s.replace(/\s+/g, ' ').trim()
}

function convertElement(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, ctx: JsxCtx): XNode {
  const snap = snapshot(m, ctx)
  try {
    return convertElementOrThrow(m, e, ctx)
  } catch (x) {
    if (!(x instanceof NeedsPart)) throw x
    rollback(m, snap, ctx)
    m.stats.elements++
    return part(m, e, ctx, x.message)
  }
}

function convertElementOrThrow(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, ctx: JsxCtx): XNode {
  m.stats.elements++
  const tag = tagName(e)
  const tagText = tag.getText()
  const attrs = attributesOf(e)
  if (attrs.properties.some((p) => ts.isJsxSpreadAttribute(p))) throw new NeedsPart(`<${tagText} {...spread}> (spread props)`)
  // Intrinsic elements.
  if (ts.isIdentifier(tag) && /^[a-z]/.test(tag.text)) return intrinsic(m, e, tag.text, ctx)
  // Components.
  const imported = importOf(m, tag)
  if (imported?.module === 'lucide-react') return icon(m, e, imported.name, ctx)
  if (imported?.module === 'react-router-dom' && imported.name === 'Link') return routerLink(m, e, ctx)
  const info = imported ? m.cfg.registry.element(imported.module, imported.name) : undefined
  if (info) return component(m, e, info, ctx)
  // A dynamic icon of a row (`<c.Icon size={16}/>`): an Icon bound to the component.
  if (ts.isPropertyAccessExpression(tag) && ctx.rows && iconLike(m, tag)) return dynamicIcon(m, e, tag, ctx)
  return hostComponent(m, e, ctx, `<${tagText}> is no .kbview element (${imported ? `${imported.module}#${imported.name}` : 'a local or dynamic component'})`)
}

function iconLike(m: Migration, tag: ts.Expression): boolean {
  const t = m.checker.typeToString(m.checker.getTypeAtLocation(tag))
  return /LucideIcon|ForwardRefExoticComponent<.*LucideProps/.test(t)
}

/** Where a JSX tag name is imported from (`@ui#Button`, `lucide-react#Check`). */
function importOf(m: Migration, tag: ts.JsxTagNameExpression): { module: string; name: string } | undefined {
  if (!ts.isIdentifier(tag)) return undefined
  const sym = m.checker.getSymbolAtLocation(tag)
  const d = sym?.declarations?.[0]
  if (!d) return undefined
  if (ts.isImportSpecifier(d)) {
    const decl = d.parent.parent.parent
    const module = (decl.moduleSpecifier as ts.StringLiteral).text
    return { module, name: (d.propertyName ?? d.name).text }
  }
  if (ts.isImportClause(d)) {
    const module = (d.parent.moduleSpecifier as ts.StringLiteral).text
    // `import Button from '@ui/Button'` → `@ui#Button`
    const m2 = /^@ui\/(\w+)$/.exec(module)
    return m2 ? { module: '@ui', name: m2[1] } : { module, name: 'default' }
  }
  return undefined
}

// ── Elements ────────────────────────────────────────────────────────────────

interface Handled {
  node: XNode
  /** Attribute names of the JSX element already turned into markup. */
  done: Set<string>
}

/** The common attributes of any element: `key`, `className`, `style`, aria, `title`, `role`, `tabIndex`, events. */
function commonAttrs(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, h: Handled, ctx: JsxCtx, info?: ElementInfo): void {
  for (const p of attributesOf(e).properties) {
    if (!ts.isJsxAttribute(p)) continue
    const name = p.name.getText()
    if (h.done.has(name)) continue
    const init = p.initializer
    const expr = init && ts.isJsxExpression(init) ? init.expression : undefined
    const str = staticString(p)
    switch (name) {
      case 'key':
        h.done.add(name)
        continue
      case 'aria-label':
        attr(h.node, 'AccessibleName', expr ? valueOf(m, expr, ctx, 'accessible_name', 'text') : str ?? '')
        h.done.add(name)
        continue
      case 'title':
        attr(h.node, 'ToolTip', expr ? valueOf(m, expr, ctx, 'tooltip', 'text') : str ?? '')
        // The title names the element for screen readers when it shows no text (icons only).
        const showsText = ts.isJsxElement(e) && e.children.some((c) => (ts.isJsxText(c) && !!c.text.trim()) || (ts.isJsxExpression(c) && !!c.expression && !containsJsx(c.expression) && isTextValue(m, c.expression)))
        if (!h.node.attrs.some((a) => a.name === 'AccessibleName') && !showsText) {
          attr(h.node, 'AccessibleName', expr ? valueOf(m, expr, ctx, 'accessible_name', 'text') : str ?? '')
        }
        h.done.add(name)
        continue
      case 'role': {
        const r = str !== undefined ? ROLE_OF_ARIA[str] : undefined
        if (r && (!info || info.propertyNames.has('AccessibleRole'))) {
          attr(h.node, 'AccessibleRole', r)
          h.done.add(name)
        }
        continue
      }
      case 'aria-hidden':
      case 'aria-modal': {
        const prop = name === 'aria-hidden' ? 'AccessibleHidden' : 'AccessibleModal'
        if (info && !info.propertyNames.has(prop)) continue
        attr(h.node, prop, expr ? valueOf(m, expr, ctx, snake(prop), 'bool') : str === undefined || str === 'true' ? 'true' : 'false')
        h.done.add(name)
        continue
      }
      case 'tabIndex':
        if (expr) attr(h.node, 'TabIndex', valueOf(m, expr, ctx, 'tab_index'))
        else if (str !== undefined) attr(h.node, 'TabIndex', str)
        h.done.add(name)
        continue
    }
    const ev = /^on[A-Z]/.test(name) ? domEvent(name) : undefined
    if (ev && expr && (!info || info.eventNames.has(ev))) {
      attr(h.node, ev, handler(m, expr, ctx, h.node, ev, { dom: true }))
      h.done.add(name)
    }
  }
}

/** React DOM event prop → `.kbview` event (the DOM events every element has, `event_map` `dom`). */
function domEvent(prop: string): string | undefined {
  const map: Record<string, string> = {
    onClick: 'OnClick', onDoubleClick: 'OnDoubleClick', onMouseDown: 'OnMouseDown', onMouseUp: 'OnMouseUp',
    onMouseMove: 'OnMouseMove', onMouseEnter: 'OnMouseEnter', onMouseLeave: 'OnMouseLeave', onKeyDown: 'OnKeyDown',
    onKeyUp: 'OnKeyUp', onKeyPress: 'OnKeyPress', onFocus: 'OnGotFocus', onBlur: 'OnLostFocus', onSubmit: 'OnSubmit',
    onDragEnter: 'OnDragEnter', onDragOver: 'OnDragOver', onDragLeave: 'OnDragLeave', onDrop: 'OnDragDrop', onWheel: 'OnMouseWheel',
  }
  return map[prop]
}

/** The DOM event type of a `.kbview` DOM event (a handler on an HTML element gets the native event). */
const DOM_EVENT_TYPES: Readonly<Record<string, string>> = {
  OnClick: 'MouseEvent', OnDoubleClick: 'MouseEvent', OnMouseDown: 'MouseEvent', OnMouseUp: 'MouseEvent', OnMouseMove: 'MouseEvent',
  OnMouseEnter: 'MouseEvent', OnMouseLeave: 'MouseEvent', OnKeyDown: 'KeyboardEvent', OnKeyUp: 'KeyboardEvent', OnKeyPress: 'KeyboardEvent',
  OnGotFocus: 'FocusEvent', OnLostFocus: 'FocusEvent', OnSubmit: 'SubmitEvent', OnDragEnter: 'DragEvent', OnDragOver: 'DragEvent',
  OnDragLeave: 'DragEvent', OnDragDrop: 'DragEvent', OnMouseWheel: 'WheelEvent',
}

/** Where an event comes from: an HTML element's DOM event, or a component callback (`args`: the registry adapter). */
interface EventFrom {
  dom?: boolean
  args?: string
}

/** How many parameters a function value takes (0 when not a function). */
function arity(m: Migration, e: ts.Expression): number {
  const sig = m.checker.getTypeAtLocation(e).getNonNullableType().getCallSignatures()[0]
  return sig ? sig.parameters.length : 0
}

/** The handler of an event attribute: a method of the class (created from an inline function). */
function handler(m: Migration, expr: ts.Expression, ctx: JsxCtx, node: XNode, event: string, from: EventFrom = {}): string {
  m.stats.handlers++
  m.viewsTypes.add('EventArgs')
  const x = skipParens(expr)
  const base = `${snake(node.attrs.find((a) => a.name === 'x:Name')?.value ?? node.el)}_${snake(event.replace(/^On/, ''))}`
  const rowDestructure = ctx.row ? rowPrelude(ctx, x.getText()) : ''
  // What the TSX handler received: the DOM event of an HTML element, the value of a value callback, else the
  // component's (React) event.
  const received = from.args === 'value' ? 'args.value' : 'args.native'
  const receivedType = from.dom ? DOM_EVENT_TYPES[event] ?? 'Event' : undefined
  // The method's own parameters: `(_sender, args)`.
  const argsType = from.args === 'value' ? 'ValueChangedEventArgs' : from.args === 'mouse' || DOM_EVENT_TYPES[event] === 'MouseEvent' ? 'MouseEventArgs' : 'EventArgs'
  m.viewsTypes.add(argsType)
  const params = (usesArgs: boolean): string => `_sender: unknown, ${usesArgs ? 'args' : '_args'}: ${argsType}`
  if (ts.isIdentifier(x)) {
    const l = m.localOf(x)
    // A component method passed as is (`onClick={copy}`): bound directly when it takes no event.
    if (l?.kind === 'method' && !ctx.row) {
      const f = methodFn(l)
      if (f && f.parameters.length === 0) return l.member
      const name = m.member(base)
      m.methods.push({ name, params: params(true), body: `{\n    return this.${l.member}(${received} as never)\n  }`, async: false })
      return name
    }
    if (l && (l.kind === 'prop' || l.kind === 'hook-fn' || l.kind === 'setter')) {
      const name = m.member(base)
      const callee = l.kind === 'prop' ? `this.props.${l.member}?.` : l.kind === 'setter' ? `this.${refText(m, l).replace(/\.bind\(this\)$/, '')}` : `this.${l.member}`
      const takes = arity(m, x) > 0
      m.methods.push({ name, params: params(takes || !!rowDestructure), body: `{\n${rowDestructure}    ${callee}(${takes ? `${received} as never` : ''})\n  }`, async: false })
      return name
    }
  }
  if (ts.isArrowFunction(x) || ts.isFunctionExpression(x)) {
    const name = m.member(base)
    const isAsync = !!x.modifiers?.some((k) => k.kind === ts.SyntaxKind.AsyncKeyword)
    let prelude = rowDestructure
    const p = x.parameters[0]
    if (p) {
      if (!ts.isIdentifier(p.name)) throw new NeedsPart(`a handler destructuring its event (${x.getText().slice(0, 40)}…)`)
      // The parameter keeps its written type; else the DOM event type, else the type TypeScript inferred when it can be
      // written here, else `any` (the TSX's own code then type-checks as before).
      const inferred = !p.type && !receivedType ? printableType(m, p) : undefined
      const t = p.type ? p.type.getText() : receivedType ?? inferred ?? 'any'
      prelude += `    const ${p.name.text} = ${received} as ${t}\n`
    }
    const inner = m.rewrite(x.body, { rows: rowParamsAsLocals(ctx, new Map(ctx.rows ?? [])) })
    const body = ts.isBlock(x.body) ? `{\n${prelude}${inner.replace(/^\{\n?/, '')}` : `{\n${prelude}    ${needsReturn(x.body) ? 'return ' : ''}${inner}\n  }`
    m.methods.push({ name, params: params(!!p || !!rowDestructure), body, async: isAsync })
    return name
  }
  // Any other expression (a call returning a handler…): evaluate it and call the result.
  const name = m.member(base)
  const fnText = m.rewrite(x, { rows: rowParamsAsLocals(ctx, new Map(ctx.rows ?? [])) })
  m.methods.push({ name, params: params(true), body: `{\n${rowDestructure}    return (${fnText})?.(${received} as never)\n  }`, async: false })
  return name
}

/** TypeScript's type of `node` when it can be written in the code-behind without an import (primitives, DOM, React). */
function printableType(m: Migration, node: ts.Node): string | undefined {
  let text: string
  try {
    text = m.checker.typeToString(m.checker.getTypeAtLocation(node), undefined, ts.TypeFormatFlags.NoTruncation)
  } catch {
    return undefined
  }
  if (/import\(|\bany\b/.test(text)) return undefined
  const allowed = /^(string|number|boolean|null|undefined|void|never|unknown|object|true|false|Element|Event|HTMLElement|SVGElement|EventTarget|Date|Array|ReadonlyArray|Record|Partial|Readonly|React|[A-Z][A-Za-z]*Event|HTML[A-Za-z]*Element)$/
  const names = text.replace(/"[^"]*"|'[^']*'/g, '').match(/[A-Za-z_$][\w$]*/g) ?? []
  const imported = new Set(m.sf.getImportDeclarations().flatMap((i) => i.getNamedImports().map((n) => n.getAliasNode()?.getText() ?? n.getName())))
  const props = new Set((text.match(/[A-Za-z_$][\w$]*\??:/g) ?? []).map((s) => s.replace(/\??:$/, '')))
  if (names.every((n) => allowed.test(n) || imported.has(n) || props.has(n))) {
    // React's synthetic events are written `React.X` in a module without the React import.
    return text.replace(/\b(ChangeEvent|MouseEvent|KeyboardEvent|FormEvent|FocusEvent|SyntheticEvent|DragEvent|PointerEvent|WheelEvent)</g, 'React.$1<')
  }
  return undefined
}

function needsReturn(body: ts.Node): boolean {
  return !ts.isCallExpression(skipParens(body)) && !ts.isBinaryExpression(skipParens(body)) && !ts.isAwaitExpression(skipParens(body)) && !ts.isVoidExpression(skipParens(body))
}

function methodFn(l: Local): ts.FunctionLikeDeclaration | undefined {
  if (ts.isVariableDeclaration(l.decl) && l.decl.initializer) return skipParens(l.decl.initializer) as ts.FunctionLikeDeclaration
  if (ts.isFunctionDeclaration(l.decl)) return l.decl
  return undefined
}

/** In a handler of a template: `const { theme, i } = args.row as Row` — the template's parameters, as locals again. */
function rowPrelude(ctx: JsxCtx, body: string): string {
  const r = ctx.row!
  // Only the parameters the body reads (`noUnusedLocals`).
  const used = r.params.filter((p) => new RegExp(`(^|[^\\w$.])${p}(?![\\w$])`).test(body))
  return used.length ? `    const { ${used.join(', ')} } = args.row as ${'RowOf_' + r.getter}\n` : ''
}
function rowParamsAsLocals(ctx: JsxCtx, rows: Map<ts.Node, string>): Map<ts.Node, string> {
  if (!ctx.row) return rows
  // Inside a handler the row parameters are local constants (see rowPrelude): no rewriting.
  for (const d of ctx.row.paramDecls) rows.delete(d)
  return rows
}

function intrinsic(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, tag: string, ctx: JsxCtx): XNode {
  // A computed className: a Class bound to a getter (or a row field) building the same string.
  const cls = jsxAttr(e, 'className')
  const clsExpr = cls?.initializer && ts.isJsxExpression(cls.initializer) ? cls.initializer.expression : undefined
  const dynClass = cls && classValue(cls) === undefined && clsExpr ? valueOf(m, clsExpr, ctx, `${tag}_class`, 'text') : undefined
  const node = intrinsicInner(m, e, tag, ctx)
  if (dynClass) {
    attr(node, 'Class', dynClass)
    m.stats.classAttributes++
    // A size utility in the computed classes: the text has its own size.
    if (/(^|[\s'"`])text-(xs|sm|base|lg|[2-9]?xl|\[)/.test(cls!.getText())) node.attrs = node.attrs.filter((a) => a.name !== 'InheritFontSize')
  }
  return node
}

function intrinsicInner(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, tag: string, ctx: JsxCtx): XNode {
  const children = childrenOf(e)
  const cls = jsxAttr(e, 'className')
  const className = classValue(cls)
  const unsupported = attributesOf(e).properties.filter((p): p is ts.JsxAttribute => ts.isJsxAttribute(p)).map((p) => p.name.getText())
    .filter((n) => !['key', 'className', 'style', 'aria-label', 'aria-hidden', 'aria-modal', 'title', 'role', 'tabIndex', 'type', 'href', 'disabled'].includes(n) && !(/^on[A-Z]/.test(n) && domEvent(n)))
  if (['input', 'select', 'textarea', 'img', 'svg', 'canvas', 'video', 'audio', 'iframe', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'hr', 'br', 'pre'].includes(tag)) {
    throw new NeedsPart(`<${tag}> has no .kbview element yet`)
  }
  if (unsupported.length) throw new NeedsPart(`<${tag} ${unsupported.join(' ')}>: attribute(s) without a .kbview property`)
  const style = styleOf(m, e)
  if (style === null) throw new NeedsPart(`<${tag}> with a computed style`)
  const type = staticString(jsxAttr(e, 'type'))
  const h: Handled = { node: { el: 'Panel', attrs: [], children: [] }, done: new Set(['className', 'style', 'type']) }
  // A link.
  if (tag === 'a') {
    const href = jsxAttr(e, 'href')
    if (!href) throw new NeedsPart('<a> without href')
    const hv = staticString(href) ?? (href.initializer && ts.isJsxExpression(href.initializer) && href.initializer.expression ? valueOf(m, href.initializer.expression, ctx, 'href', 'text') : '')
    h.done.add('href')
    if (textOnly(children, m)) {
      h.node.el = 'LinkLabel'
      attr(h.node, 'Text', textValue(m, children, ctx, 'link_text'))
      attr(h.node, 'Href', hv)
      labelLike(m, h.node, className, style, true)
    } else {
      attr(h.node, 'Href', hv)
      containerClasses(m, h.node, className, style)
      h.node.children = convertChildren(m, children, ctx, isFlexBox(className))
    }
    m.stats.mapped++
    commonAttrs(m, e, h, ctx)
    return h.node
  }
  if (tag === 'button') {
    if (type === 'submit') throw new NeedsPart('<button type="submit"> (submits its form)')
    attr(h.node, 'AccessibleRole', 'PushButton')
    if (jsxAttr(e, 'disabled')) {
      const d = jsxAttr(e, 'disabled')!
      attr(h.node, 'Enabled', d.initializer && ts.isJsxExpression(d.initializer) && d.initializer.expression ? invertExpr(m, d.initializer.expression, ctx, nameFor(d.initializer.expression, 'enabled_unless')) : 'false')
      h.done.add('disabled')
    }
    containerClasses(m, h.node, className, style)
    h.node.children = convertChildren(m, children, ctx, isFlexBox(className))
    m.stats.mapped++
    commonAttrs(m, e, h, ctx)
    return h.node
  }
  if (!INTRINSIC_CONTAINERS[tag]) throw new NeedsPart(`<${tag}> has no .kbview element yet`)
  // A text element: a Label.
  if (TEXT_TAGS[tag] && textOnly(children, m) && children.length > 0) {
    h.node.el = 'Label'
    if (TEXT_TAGS[tag] !== 'P') attr(h.node, 'HtmlTag', TEXT_TAGS[tag])
    attr(h.node, 'Text', textValue(m, children, ctx, `${tag}_text`))
    labelLike(m, h.node, className, style, false)
    m.stats.mapped++
    commonAttrs(m, e, h, ctx)
    return h.node
  }
  // A container.
  const stack = tag === 'div' && className && !style.classes.length ? mapStackClasses(className) : undefined
  if (stack) {
    h.node.el = 'Stack'
    for (const [k, v] of Object.entries(stack.props)) attr(h.node, k, v)
    for (const [k, v] of Object.entries(style.props)) attr(h.node, k, v)
    if (stack.rest.length) {
      attr(h.node, 'Class', stack.rest.join(' '))
      m.stats.classAttributes++
    }
  } else {
    if (tag !== 'div') attr(h.node, 'HtmlTag', INTRINSIC_CONTAINERS[tag])
    containerClasses(m, h.node, className, style)
  }
  m.stats.mapped++
  commonAttrs(m, e, h, ctx)
  h.node.children = convertChildren(m, children, { ...ctx, parentFlex: !!stack }, !!stack || isFlexBox(className))
  return h.node
}

/** `style={{…}}` → properties / arbitrary classes; `null` when computed. */
function styleOf(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement): { props: Record<string, string>; classes: string[] } | null {
  const a = jsxAttr(e, 'style')
  if (!a) return { props: {}, classes: [] }
  const init = a.initializer
  if (!init || !ts.isJsxExpression(init) || !init.expression || !ts.isObjectLiteralExpression(init.expression)) return null
  const obj: Record<string, string | number> = {}
  for (const p of init.expression.properties) {
    if (!ts.isPropertyAssignment(p) || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) return null
    const v = skipParens(p.initializer)
    if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) obj[p.name.text] = v.text
    else if (ts.isNumericLiteral(v)) obj[p.name.text] = Number(v.text)
    else return null
  }
  const mapped = mapStaticStyle(obj)
  if (!mapped) return null
  void m
  return mapped
}

function containerClasses(m: Migration, n: XNode, className: string | undefined, style: { props: Record<string, string>; classes: string[] }): void {
  const mapped = className ? mapContainerClasses(className) : { props: {}, rest: [] }
  for (const [k, v] of Object.entries({ ...mapped.props, ...style.props })) attr(n, k, v)
  const rest = [...mapped.rest, ...style.classes]
  if (rest.length) {
    attr(n, 'Class', rest.join(' '))
    m.stats.classAttributes++
  }
}

function labelLike(m: Migration, n: XNode, className: string | undefined, style: { props: Record<string, string>; classes: string[] }, link: boolean): void {
  const mapped = mapLabelClasses(className ?? '')
  for (const [k, v] of Object.entries(mapped.props)) {
    if (link && (k === 'Overflow' || k === 'TextAlign')) continue
    attr(n, k, v)
  }
  for (const [k, v] of Object.entries(style.props)) attr(n, k, v)
  if (!mapped.hasSize) attr(n, 'InheritFontSize', 'true')
  const rest = [...mapped.rest, ...style.classes]
  if (link && !className?.split(/\s+/).includes('truncate')) {
    // A LinkLabel has no Overflow: it never truncates.
  }
  if (rest.length) {
    attr(n, 'Class', rest.join(' '))
    m.stats.classAttributes++
  }
}

/** A Lucide icon (`<Check size={14} className="…"/>`) → `<Icon Name="Check" Size="14" …/>`. */
function icon(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, name: string, ctx: JsxCtx): XNode {
  const h: Handled = { node: { el: 'Icon', attrs: [{ name: 'Name', value: name }], children: [] }, done: new Set() }
  for (const p of attributesOf(e).properties) {
    if (!ts.isJsxAttribute(p)) continue
    const n = p.name.getText()
    if (n === 'size') {
      const v = staticString(p) ?? (p.initializer && ts.isJsxExpression(p.initializer) && p.initializer.expression ? valueOf(m, p.initializer.expression, ctx, 'icon_size') : undefined)
      if (v !== undefined) attr(h.node, 'Size', v)
      h.done.add(n)
    } else if (n === 'className') {
      const c = classValue(p)
      if (c === undefined) throw new NeedsPart('an icon with a computed className')
      // The class goes on the glyph itself (Icon renders `<span class="contents"><svg class=…/></span>`).
      if (c) {
        attr(h.node, 'Class', c)
        m.stats.classAttributes++
      }
      h.done.add(n)
    } else if (n === 'key') h.done.add(n)
    else if (n === 'aria-hidden') h.done.add(n)
    else throw new NeedsPart(`<${name} ${n}>: an icon attribute without a property`)
  }
  if (!h.node.attrs.some((a) => a.name === 'Size')) attr(h.node, 'Size', '24')
  m.stats.mapped++
  return h.node
}

/** `<c.Icon size={16}/>` in a template: an Icon whose `Name` is a row field holding `{ c: Component }`. */
function dynamicIcon(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, tag: ts.PropertyAccessExpression, ctx: JsxCtx): XNode {
  const comp = m.rewrite(tag, { rows: ctx.rows })
  // The runtime takes an icon value `{ c: Component }` for `Name` (the type of the property is a name).
  const field = binding(m, tag, `{ c: ${comp} } as unknown as string`, ctx, 'icon')
  const n = icon(m, e, 'X', ctx)
  if (n.el !== 'Icon') return n
  attr(n, 'Name', field)
  return n
}

/** `<Link to=… className=…>` → a `LinkLabel` (text) or a `Panel Href` (content), navigating with the router. */
function routerLink(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, ctx: JsxCtx): XNode {
  const to = jsxAttr(e, 'to')
  const unsupported = attributesOf(e).properties.filter((p): p is ts.JsxAttribute => ts.isJsxAttribute(p)).map((p) => p.name.getText()).filter((n) => !['to', 'className', 'key', 'title', 'aria-label', 'onClick'].includes(n))
  if (!to || unsupported.length) throw new NeedsPart(`<Link ${unsupported.join(' ')}>`)
  const toExpr = to.initializer && ts.isJsxExpression(to.initializer) && to.initializer.expression ? to.initializer.expression : undefined
  const href = toExpr ? valueOf(m, toExpr, ctx, 'href', 'text') : staticString(to) ?? ''
  const children = childrenOf(e)
  const className = classValue(jsxAttr(e, 'className'))
  const h: Handled = { node: { el: textOnly(children, m) ? 'LinkLabel' : 'Panel', attrs: [], children: [] }, done: new Set(['to', 'className', 'onClick']) }
  attr(h.node, 'Href', href)
  if (h.node.el === 'LinkLabel') {
    attr(h.node, 'Text', textValue(m, children, ctx, 'link_text'))
    labelLike(m, h.node, className, { props: {}, classes: [] }, true)
  } else {
    containerClasses(m, h.node, className, { props: {}, classes: [] })
    h.node.children = convertChildren(m, children, ctx, isFlexBox(className))
  }
  // A plain click stays in the app: navigate like <Link> does.
  m.needsNavigate = true
  const name = m.member(`${snake(h.node.el)}_click`)
  const target = toExpr ? m.rewrite(toExpr, { rows: rowParamsAsLocals(ctx, new Map(ctx.rows ?? [])) }) : JSON.stringify(staticString(to) ?? '')
  const prelude = ctx.row ? rowPrelude(ctx, target) : ''
  m.methods.push({ name, params: `_sender: unknown, ${prelude ? 'args' : '_args'}: MouseEventArgs`, body: `{
${prelude}    this.navigate(${target})
  }`, async: false })
  m.viewsTypes.add('MouseEventArgs')
  attr(h.node, 'OnClick', name)
  m.stats.handlers++
  m.stats.mapped++
  commonAttrs(m, e, h, ctx)
  return h.node
}

/** An `@ui` / project component with a registry element. */
function component(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, info: ElementInfo, ctx: JsxCtx): XNode {
  const h: Handled = { node: { el: info.name, attrs: [], children: [] }, done: new Set() }
  const children = childrenOf(e).filter((c) => !(ts.isJsxText(c) && !c.text.trim()))
  // Two-way binding: `value={x}` + `onChange={(e) => setX(e.target.value)}` (or `(v) => setX(v)`, `onChange={setX}`)
  // on a state field → `Text="{Binding x, Mode=TwoWay}"`, no handler.
  for (const [prop, target] of info.props) {
    if (!target.change) continue
    const valueAttr = jsxAttr(e, prop)
    const ev = [...info.events].find(([, x]) => x.name === target.change)
    const changeAttr = ev ? jsxAttr(e, ev[0]) : undefined
    const valueExpr = valueAttr?.initializer && ts.isJsxExpression(valueAttr.initializer) ? valueAttr.initializer.expression : undefined
    const changeExpr = changeAttr?.initializer && ts.isJsxExpression(changeAttr.initializer) ? changeAttr.initializer.expression : undefined
    if (!valueExpr || !changeExpr || !ts.isIdentifier(skipParens(valueExpr))) continue
    const state = m.localOf(skipParens(valueExpr) as ts.Identifier)
    if (state?.kind !== 'state') continue
    const setter = [...m.locals.values()].find((l) => l.kind === 'setter' && l.state === state.member)
    if (!setter || !isPlainSetterCall(m, changeExpr, setter, ev![1].args)) continue
    attr(h.node, target.name, `{Binding ${state.member}, Mode=TwoWay}`)
    m.stats.bindings++
    h.done.add(prop)
    h.done.add(ev![0])
  }
  for (const p of attributesOf(e).properties) {
    if (ts.isJsxAttribute(p) && h.done.has(p.name.getText())) continue
    if (!ts.isJsxAttribute(p)) continue
    const name = p.name.getText()
    if (['key'].includes(name)) {
      h.done.add(name)
      continue
    }
    const target = info.props.get(name)
    const event = info.events.get(name)
    const init = p.initializer
    const expr = init && ts.isJsxExpression(init) ? init.expression : undefined
    if (target) {
      let value: string
      if (!init) value = 'true'
      else if (ts.isStringLiteral(init)) value = target.values ? target.values.get(init.text) ?? init.text : init.text
      else if (expr) {
        const x = skipParens(expr)
        if ((ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) && target.values) value = target.values.get(x.text) ?? x.text
        else if (target.convert === 'invert') value = invertExpr(m, expr, ctx, nameFor(expr, 'enabled_unless'))
        else if (target.convert === 'icon-node' || target.convert === 'icon-component') {
          // An icon: a Lucide element or component becomes its name (`icon={<Plus size={16}/>}` → `Icon="Plus"`).
          const name = lucideName(m, x)
          if (!name) throw new NeedsPart(`<${info.name} ${name ?? target.name}>: an icon that is not a Lucide icon`)
          value = name
        } else if (target.convert && !isTextValue(m, x as ts.Expression)) throw new NeedsPart(`<${info.name}> ${p.name.getText()}: a value the property converts (${target.convert})`)
        else value = valueOf(m, expr, ctx, target.name, kindOfProp(info, target.name))
      } else continue
      attr(h.node, target.name, value)
      h.done.add(name)
      continue
    }
    if (event && expr) {
      attr(h.node, event.name, handler(m, expr, ctx, h.node, event.name, { args: event.args }))
      h.done.add(name)
    }
  }
  commonAttrs(m, e, h, ctx, info)
  const left = attributesOf(e).properties.filter((p): p is ts.JsxAttribute => ts.isJsxAttribute(p)).map((p) => p.name.getText()).filter((n) => !h.done.has(n) && n !== 'className')
  if (left.length) throw new NeedsPart(`<${info.name}> ${left.join(', ')}: no .kbview property`)
  const cls = jsxAttr(e, 'className')
  if (cls) {
    const c = classValue(cls)
    if (c === undefined) throw new NeedsPart(`<${info.name}> with a computed className`)
    if (c && info.propertyNames.has('Class')) {
      attr(h.node, 'Class', c)
      m.stats.classAttributes++
    } else if (c) throw new NeedsPart(`<${info.name} className>: the element has no Class`)
  }
  // Children: text → the element's text property; elements → content.
  if (children.length) {
    const textProp = [...info.props.values()].find((t) => info.props.get('children') === t)
    if (textProp && textOnly(children, m)) attr(h.node, textProp.name, textValue(m, children, ctx, `${snake(info.name)}_text`))
    else if (info.content && info.children !== 'None') h.node.children = children.flatMap((c) => convertChild(m, c, ctx))
    else throw new NeedsPart(`<${info.name}> with element children`)
  }
  m.stats.mapped++
  return h.node
}

function kindOfProp(info: ElementInfo, name: string): 'text' | 'bool' | 'any' {
  const d = info.defaults.get(name)
  if (d === 'true' || d === 'false') return 'bool'
  return 'any'
}

/** `list.map((item, i) => <Row/>)` → a Repeater over a memoized rows getter. */
function repeater(m: Migration, list: ts.Expression, cb: ts.ArrowFunction | ts.FunctionExpression, ctx: JsxCtx, call: ts.CallExpression): XNode {
  m.stats.elements++
  if (ctx.row) return part(m, call, ctx, 'a list inside a list (nested Repeater)')
  const body = ts.isBlock(cb.body) ? undefined : skipParens(cb.body)
  if (!body || !(ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body))) {
    // A block body with derived constants before the JSX.
    if (ts.isBlock(cb.body)) {
      const stmts = cb.body.statements
      const last = stmts[stmts.length - 1]
      if (last && ts.isReturnStatement(last) && last.expression && stmts.slice(0, -1).every((s) => ts.isVariableStatement(s))) {
        return repeaterWithLocals(m, list, cb, stmts, ctx, call)
      }
    }
    return part(m, call, ctx, 'a list whose item is not a single element')
  }
  return buildRepeater(m, list, cb, [], skipParens(body) as ts.JsxElement, ctx, call)
}

function repeaterWithLocals(m: Migration, list: ts.Expression, cb: ts.ArrowFunction | ts.FunctionExpression, stmts: readonly ts.Statement[], ctx: JsxCtx, call: ts.CallExpression): XNode {
  const ret = stmts[stmts.length - 1] as ts.ReturnStatement
  const el = skipParens(ret.expression!)
  if (!(ts.isJsxElement(el) || ts.isJsxSelfClosingElement(el))) return part(m, call, ctx, 'a list whose item is not a single element')
  return buildRepeater(m, list, cb, stmts.slice(0, -1) as ts.VariableStatement[], el, ctx, call)
}

function buildRepeater(m: Migration, list: ts.Expression, cb: ts.ArrowFunction | ts.FunctionExpression, locals: ts.VariableStatement[], el: ts.JsxElement | ts.JsxSelfClosingElement, ctx: JsxCtx, call: ts.CallExpression): XNode {
  const params: string[] = []
  const paramDecls: ts.Node[] = []
  for (const p of cb.parameters) {
    if (!ts.isIdentifier(p.name)) return part(m, call, ctx, 'a list callback destructuring its item')
    params.push(p.name.text)
    paramDecls.push(p)
  }
  const listName = ts.isIdentifier(skipParens(list)) ? (skipParens(list) as ts.Identifier).text : ts.isPropertyAccessExpression(skipParens(list)) ? (skipParens(list) as ts.PropertyAccessExpression).name.text : 'items'
  const getterName = m.member(`rows_${snake(listName) || 'items'}`)
  const scope: RowScope = { getter: getterName, params, paramDecls, fields: new Map() }
  const rows = new Map<ts.Node, string>(ctx.rows ?? [])
  // Inside the template, a parameter is a row field of the same name.
  for (const d of paramDecls) rows.set(d, `__row.${(d as ts.ParameterDeclaration).name.getText()}`)
  // Locals of the callback (`const isActive = …`): row fields.
  for (const s of locals) {
    for (const d of s.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || !d.initializer) return part(m, call, ctx, 'a list callback with a destructuring local')
      rows.set(d, `__row.${d.name.text}`)
      scope.fields.set(d.name.text, m.rewrite(d.initializer, { rows }))
      params.push(d.name.text)
      paramDecls.push(d)
    }
  }
  const inner: JsxCtx = { ...ctx, row: scope, rows }
  const keyAttr = jsxAttr(el, 'key')
  const keyExpr = keyAttr?.initializer && ts.isJsxExpression(keyAttr.initializer) && keyAttr.initializer.expression ? keyAttr.initializer.expression : undefined
  const tmpl = convertChild(m, el, inner)
  const rep: XNode = { el: 'Repeater', attrs: [], children: tmpl }
  // The rows: one object per item with the parameters and every row field.
  const listText = m.rewrite(list, { rows: ctx.rows })
  const fieldLines = [...scope.fields].filter(([k]) => !cb.parameters.some((p) => p.name.getText() === k) || !locals.length).map(([k, v]) => `${k}: ${v.replace(/__row\./g, '')}`)
  // Row fields reference the parameters and earlier locals by name: compute them in order inside the callback.
  const p0 = params[0] ?? 'item'
  const idx = cb.parameters[1] ? cb.parameters[1].name.getText() : undefined
  const localDecls = locals.flatMap((s) => s.declarationList.declarations.map((d) => `const ${d.name.getText()} = ${m.rewrite(d.initializer!, { rows: new Map(ctx.rows ?? []) })}`))
  const own = fieldLines.filter((l) => !locals.some((s) => s.declarationList.declarations.some((d) => l.startsWith(d.name.getText() + ':'))))
  const objectFields = [p0, ...(idx ? [idx] : []), ...locals.flatMap((s) => s.declarationList.declarations.map((d) => d.name.getText())), ...own]
  if (keyExpr) {
    // The row object carries its key (`ItemKey` names a field of the row).
    objectFields.push(`key: ${m.rewrite(keyExpr, { rows: new Map(ctx.rows ?? []) })}`)
    attr(rep, 'ItemKey', 'key')
  }
  const mapper = `(${[p0, idx].filter(Boolean).join(', ')}) => {${localDecls.map((d) => `\n      ${d}`).join('')}\n      return { ${objectFields.join(', ')} }\n    }`
  const body = `${listText}.map(${mapper})`
  m.getters.push({ name: getterName, body, memo: true, doc: `The rows of the Repeater over \`${list.getText().replace(/\s+/g, ' ')}\`.` })
  m.needsMemoize = true
  m.stats.getters++
  attr(rep, 'ItemsSource', `{Binding ${getterName}}`)
  return rep
}

/** What does not convert: a component of `X.parts.tsx`, rendered through `<ReactHost>`. */
function part(m: Migration, node: ts.Node, ctx: JsxCtx, why: string): XNode {
  m.stats.parts++
  m.reason(why)
  const name = m.member(`Part${m.parts.length + 1}`)
  // Free variables: the component's locals and the template parameters it reads.
  const free = new Map<string, { expr: string; type?: string }>()
  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n)) {
      const p = n.parent
      if ((ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || ts.isJsxAttribute(p)) return
      if (ctx.rows) {
        const r = m.rowParamOf(n, ctx.rows)
        if (r !== undefined) {
          free.set(n.text, { expr: r, type: `${m.stem}['${ctx.row!.getter}'][number]['${n.text}']` })
          return
        }
      }
      const l = m.localOf(n)
      if (l) free.set(n.text, { expr: refText(m, l), type: l.kind === 'prop' ? `${m.stem}['props']['${l.member}']` : l.kind === 'props-object' ? `${m.stem}['props']` : `${m.stem}['${l.member}']` })
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  const props = [...free].map(([n, v]) => ({ name: n, expr: v.expr, type: v.type }))
  // A list or an expression is wrapped in a fragment (a part renders one element).
  const jsx = ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node) ? node.getText() : `<>{${node.getText()}}</>`
  m.parts.push({ name, props, jsx, rowScoped: !!ctx.row })
  // The props object: a memoized getter (page) or a row field (template).
  const obj = `{ ${props.map((p) => `${p.name}: ${p.expr}`).join(', ')} }`
  const value = props.length ? binding(m, ts.factory.createObjectLiteralExpression(), obj, ctx, `${name}_props`) : undefined
  const n: XNode = { el: 'ReactHost', attrs: [], children: [], comment: `TODO(views-migrate): ${why}` }
  m.getters.push({ name, body: `__parts.${name}`, memo: false, doc: `A part of the screen still written in React (${why}).` })
  attr(n, 'Component', `{Binding ${name}}`)
  if (value) attr(n, 'Props', value)
  return n
}

/** How a component-scope name is reached from the class (a part's prop, a row field). */
function refText(m: Migration, l: Local): string {
  switch (l.kind) {
    case 'prop': return `this.props.${l.member}`
    case 'props-object': return 'this.props'
    case 'method': return `this.${l.member}.bind(this)`
    case 'setter':
      m.usedSetters.add(l)
      return `this.${l.member}.bind(this)`
    default: return `this.${l.member}`
  }
}

/**
 * A component that is no `.kbview` element (another screen, a local helper component) used without children: a
 * `<ReactHost>` rendering that very component with its props — no wrapper part. A local component of the file
 * moves to `X.parts.tsx`. With children, or a spread, it becomes a part.
 */
function hostComponent(m: Migration, e: ts.JsxElement | ts.JsxSelfClosingElement, ctx: JsxCtx, why: string): XNode {
  const tag = tagName(e)
  const children = childrenOf(e).filter((c) => !(ts.isJsxText(c) && !c.text.trim()))
  if (!ts.isIdentifier(tag) || children.length) throw new NeedsPart(why)
  const local = m.localComponents.has(tag.text)
  const imported = !local && importOf(m, tag)
  if (!local && !imported) throw new NeedsPart(why)
  m.stats.parts++
  m.reason(why)
  const entries: string[] = []
  for (const p of attributesOf(e).properties) {
    if (!ts.isJsxAttribute(p)) throw new NeedsPart(why)
    const name = p.name.getText()
    if (name === 'key') continue
    const init = p.initializer
    let value: string
    if (!init) value = 'true'
    else if (ts.isStringLiteral(init)) value = JSON.stringify(init.text)
    else if (ts.isJsxExpression(init) && init.expression) value = m.rewrite(init.expression, { rows: ctx.rows })
    else throw new NeedsPart(why)
    entries.push(`${/^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name)}: ${value}`)
  }
  if (local) m.exportedLocals.add(tag.text)
  // One getter per component, however many times it is used (`gettersByExpr`).
  const comp = m.getter(tag.text, local ? `__parts.${tag.text}` : tag.text, { doc: `\`<${tag.text}>\`, rendered by a ReactHost.` })
  const n: XNode = { el: 'ReactHost', attrs: [], children: [], comment: `TODO(views-migrate): ${why}` }
  attr(n, 'Component', `{Binding ${comp}}`)
  if (entries.length) attr(n, 'Props', binding(m, ts.factory.createObjectLiteralExpression(), `{ ${entries.join(', ')} }`, ctx, `${snake(tag.text)}_props`))
  return n
}

// ── Output files ─────────────────────────────────────────────────────────────

/** Whether `name` is used as an identifier in `text` (not as a property `x.name`). */
function mentions(name: string, text: string): boolean {
  // Comments do not count (a getter's doc names the component it renders).
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1')
  return new RegExp('(^|[^\\w$.])' + name.replace(/\$/g, '\\$') + '(?![\\w$])').test(code)
}

/** The import lines of `sf` restricted to what `text` uses. */
function importsUsedBy(sf: SourceFile, text: string): string[] {
  const out: string[] = []
  for (const imp of sf.getImportDeclarations()) {
    const named = imp.getNamedImports().filter((n) => mentions(n.getAliasNode()?.getText() ?? n.getName(), text))
    const def = imp.getDefaultImport()
    const ns = imp.getNamespaceImport()
    const parts: string[] = []
    if (def && mentions(def.getText(), text)) parts.push(def.getText())
    if (ns && mentions(ns.getText(), text)) parts.push(`* as ${ns.getText()}`)
    if (named.length) parts.push(`{ ${named.map((n) => n.getText()).join(', ')} }`)
    if (parts.length) out.push(`import ${imp.isTypeOnly() ? 'type ' : ''}${parts.join(', ')} from ${JSON.stringify(imp.getModuleSpecifierValue())}`)
  }
  return out
}

function codeBehind(m: Migration, target: FoundComponent, xmlText: string): string {
  const sf = m.sf
  // State setters used as values (`onChange={setX}`, a setter given to a part): one method each.
  for (const l of m.usedSetters) {
    const state = [...m.locals.values()].find((x) => x.member === l.state)
    const t = state?.type ?? `${m.stem}['${l.state}']`
    m.methods.push({
      name: l.member,
      params: `value: ${t} | ((prev: ${t}) => ${t})`,
      body: `{\n    this.${l.state} = typeof value === 'function' ? (value as (prev: ${t}) => ${t})(this.${l.state}) : value\n  }`,
      async: false,
      doc: `\`${l.name}\` of the TSX: a value, or an update of the previous one.`,
    })
  }
  const body: string[] = []
  if (m.propsTypeDecl) body.push(`export type ${m.propsType} = ${m.propsTypeDecl}`, '')
  else if (m.propsType && !sf.getInterface(m.propsType)?.isExported() && !sf.getTypeAlias(m.propsType)?.isExported() && (sf.getInterface(m.propsType) || sf.getTypeAlias(m.propsType))) {
    body.push(`export type { ${m.propsType} }`, '')
  }
  // The file's other statements (types, constants, helpers): kept when the code-behind uses them (see below).
  const helpers: Array<{ names: string[]; text: string }> = []
  for (const st of sf.getStatements()) {
    if (Node.isImportDeclaration(st) || Node.isExportAssignment(st)) continue
    if (Node.isFunctionDeclaration(st) && (st.getName() === target.name || m.localComponents.has(st.getName() ?? ''))) continue
    if (Node.isVariableStatement(st) && st.getDeclarations().some((d) => d.getName() === target.name || m.localComponents.has(d.getName()))) continue
    const names = Node.isVariableStatement(st) ? st.getDeclarations().map((d) => d.getName()) : [((st as unknown as { getName?: () => string | undefined }).getName?.() ?? '')]
    helpers.push({ names, text: st.getText() })
  }
  const cls: string[] = []
  cls.push(`export class ${m.stem} extends ViewBase {`)
  // The hooks run in `useHooks()`; what they give is typed from it (`<X>Hooks['name']`): no type to import.
  const hooksType = `${m.stem}Hooks`
  const hookLocals = [...m.locals.values()].filter((l) => l.kind === 'hook-data' || l.kind === 'hook-fn' || l.kind === 'translate')
  const reads = [xmlText, ...m.getters.map((g) => g.body), ...m.methods.map((x) => x.body)].join('\n')
  const used = hookLocals.filter((l) => new RegExp('(this\\.|Binding |[^\\w$])' + l.member + '(?![\\w$])').test(reads))
  const members: string[] = []
  for (const l of m.locals.values()) {
    if (l.kind === 'state') members.push(`  @bind accessor ${l.member}${l.type ? `: ${l.type}` : ''} = ${l.init}`)
  }
  for (const l of used) {
    if (l.kind === 'hook-data') members.push(`  @bind accessor ${l.member}: ${hooksType}['${l.name}'] = undefined as never`)
    else members.push(`  ${l.member}!: ${hooksType}['${l.name}']`)
  }
  if (m.needsNavigate) members.push(`  navigate!: ReturnType<typeof useNavigate>`)
  if (members.length) cls.push(...members, '')
  const hookBody = m.useBody.map((s) => s.split('\n').map((l) => '    ' + l.trimStart()).join('\n'))
  if (hookBody.length || m.needsNavigate) {
    if (hookBody.length) {
      cls.push(`  /** The screen's hooks, as the TSX called them (React's rules apply): run by \`use()\` on every render. */`, '  useHooks() {', ...hookBody)
      cls.push(`    return { ${hookLocals.map((l) => l.name).join(', ')} }`, '  }', '')
    }
    cls.push(`  /** Publishes what the hooks give as fields (the bindings and the methods read them). */`, '  use(): void {')
    if (hookBody.length) {
      cls.push(used.length ? '    const h = this.useHooks()' : '    this.useHooks()')
      for (const l of used) cls.push(`    this.${l.member} = h.${l.name}`)
    }
    if (m.needsNavigate) cls.push('    this.navigate = useNavigate()')
    cls.push('  }', '')
  }
  const depsOf = new Map(m.getters.filter((x) => x.memo).map((g) => [g.name, m.deps(g.body)] as const))
  for (const g of m.getters) {
    if (g.doc) cls.push(`  /** ${g.doc} */`)
    // A getter of an element shown under a condition is only read when it holds (as the TSX only rendered it then).
    const guard = g.guards?.length ? `    if (${g.guards.map((c) => `!(${c})`).join(' || ')}) return undefined as never\n` : ''
    const ret = g.type ? `: ${g.type}` : ''
    if (g.memo) {
      // An object literal returned by an arrow needs its parentheses; a guard goes inside the memoized function, where
      // it narrows what the body reads (TypeScript does not carry a narrowing of `this.x` into a callback).
      const value = g.body.trimStart().startsWith('{') ? `(${g.body})` : g.body
      const fn = guard ? `() => {\n  ${guard.replace(/\n$/, '')}\n      return ${value}\n    }` : `() => ${value}`
      cls.push(`  get ${g.name}()${ret} {`, `    return this.memo('${g.name}', [${depsOf.get(g.name)!.map((d) => `this.${d}`).join(', ')}], ${fn})`, '  }', '')
    } else cls.push(`  get ${g.name}()${ret} {`, `${guard}    return ${g.body}`, '  }', '')
  }
  for (const mt of m.methods) {
    if (mt.doc) cls.push(`  /** ${mt.doc} */`)
    cls.push(`  ${mt.async ? 'async ' : ''}${mt.name}${mt.typeParams ?? ''}(${mt.params}) ${mt.body.trim()}`, '')
  }
  // Row types of the templates (for the handlers' `args.row`).
  const methodText = m.methods.map((x) => x.body).join('\n')
  const rowTypes = m.getters.filter((g) => /^rows_/.test(g.name) && methodText.includes(`RowOf_${g.name}`)).map((g) => `type RowOf_${g.name} = ${m.stem}['${g.name}'][number]`)
  cls.push('}')
  if (rowTypes.length) cls.push('', ...rowTypes)
  if (m.useBody.length) cls.push('', `/** What the screen's hooks give (the types of the fields they fill). */`, `export type ${m.stem}Hooks = ReturnType<${m.stem}['useHooks']>`)
  cls.push('', `export default ${m.stem}.component()`, '')
  // Helpers the class uses (and the helpers those use), in file order.
  let code = body.join('\n') + cls.join('\n')
  const keep = new Set<number>()
  for (let changed = true; changed;) {
    changed = false
    const all = code + helpers.filter((_, k) => keep.has(k)).map((h) => h.text).join('\n')
    helpers.forEach((h, k) => {
      if (!keep.has(k) && h.names.some((n) => n && mentions(n, all))) {
        keep.add(k)
        changed = true
      }
    })
  }
  const helperText = helpers.filter((_, k) => keep.has(k)).map((h) => h.text + '\n')
  code = [...helperText, ...body, ...cls].join('\n')
  // Imports: the TSX's, as far as the code uses them, and what the generated code needs.
  const hasBind = [...m.locals.values()].some((l) => l.kind === 'state') || used.some((l) => l.kind === 'hook-data')
  const usedTypes = [...m.viewsTypes].filter((t) => mentions(t, code))
  const viewsNames = [...(hasBind ? ['bind'] : []), ...usedTypes.map((t) => `type ${t}`)]
  const imports = importsUsedBy(sf, code)
  const head: string[] = [`/**`, ` * Code-behind of \`${m.stem}.kbview\` (converted from \`${m.stem}.tsx\` by @kubuno/views-migrate).`, ` */`]
  if (viewsNames.length) head.push(`import { ${viewsNames.join(', ')} } from '@kubuno/views'`)
  if (m.needsNavigate && !imports.some((k) => /\buseNavigate\b/.test(k))) head.push(`import { useNavigate } from 'react-router-dom'`)
  head.push(...[...m.extraImports].filter((l) => !imports.includes(l)), ...imports, '', `import { ViewBase } from './${m.stem}.kbview'`)
  if (m.parts.length || m.exportedLocals.size) head.push(`import * as __parts from './${m.stem}.parts'`)
  head.push('')
  return head.join('\n') + '\n' + code
}

function partsFile(m: Migration): string {
  const body: string[] = []
  // The file's local components (a part, or a ReactHost, renders them).
  for (const st of m.sf.getStatements()) {
    if (Node.isFunctionDeclaration(st) && m.localComponents.has(st.getName() ?? '')) body.push('', st.getText().replace(/^export\s+(default\s+)?/, ''), `export { ${st.getName()} }`)
    if (Node.isVariableStatement(st) && st.getDeclarations().some((d) => m.localComponents.has(d.getName()))) body.push('', st.getText().replace(/^export\s+/, ''), `export { ${st.getDeclarations().map((d) => d.getName()).join(', ')} }`)
  }
  for (const p of m.parts) {
    const typed = p.props.length ? `{ ${p.props.map((x) => x.name).join(', ')} }: { ${p.props.map((x) => `${x.name}: ${x.type ?? 'any'}`).join('; ')} }` : ''
    if (p.props.some((x) => !x.type)) body.push('', '// eslint-disable-next-line @typescript-eslint/no-explicit-any')
    else body.push('')
    body.push(`export function ${p.name}(${typed}) {`, `  return (`, `    ${p.jsx.split('\n').join('\n    ')}`, `  )`, `}`)
  }
  let text = body.join('\n')
  // The other statements of the file the parts use (types, constants, helpers), then the imports they need.
  const uses = (name: string, t: string): boolean => new RegExp('(^|[^\\w$.])' + name.replace(/\$/g, '\\$') + '(?![\\w$])').test(t)
  const helpers: string[] = []
  for (const st of m.sf.getStatements()) {
    if (Node.isImportDeclaration(st) || Node.isExportAssignment(st)) continue
    if (Node.isFunctionDeclaration(st) && (st.getName() === m.name || m.localComponents.has(st.getName() ?? ''))) continue
    if (Node.isVariableStatement(st) && st.getDeclarations().some((d) => d.getName() === m.name || m.localComponents.has(d.getName()))) continue
    const names = Node.isVariableStatement(st) ? st.getDeclarations().map((d) => d.getName()) : 'getName' in st && typeof (st as { getName?: () => string | undefined }).getName === 'function' ? [(st as unknown as { getName(): string | undefined }).getName() ?? ''] : []
    if (names.some((n) => n && uses(n, text))) helpers.push(st.getText().replace(/^export\s+/, ''))
  }
  if (helpers.length) text = helpers.join('\n\n') + '\n' + text
  const imports: string[] = []
  for (const imp of m.sf.getImportDeclarations()) {
    const named = imp.getNamedImports().filter((n) => uses(n.getAliasNode()?.getText() ?? n.getName(), text))
    const def = imp.getDefaultImport()
    const ns = imp.getNamespaceImport()
    const parts: string[] = []
    if (def && uses(def.getText(), text)) parts.push(def.getText())
    if (ns && uses(ns.getText(), text)) parts.push(`* as ${ns.getText()}`)
    if (named.length) parts.push(`{ ${named.map((n) => n.getText()).join(', ')} }`)
    if (parts.length) imports.push(`import ${imp.isTypeOnly() ? 'type ' : ''}${parts.join(', ')} from ${JSON.stringify(imp.getModuleSpecifierValue())}`)
  }
  // The props of a part are typed from the code-behind (`X['field']`).
  if (m.parts.some((p) => p.props.length)) imports.push(`import type { ${m.stem} } from './${m.stem}'`)
  const head = [`/**`, ` * The parts of \`${m.stem}.kbview\` still written in React (the codemod could not convert them; see the`, ` * TODO comments in the view). Each is rendered by a \`<ReactHost>\` with the values it reads as props.`, ` */`, ...imports]
  return head.join('\n') + '\n' + text + '\n'
}

/** The component a file's conversion targets (the exported one named like the file, or the only exported one). */
export function targetComponent(sf: SourceFile, wanted?: string): string | undefined {
  const comps = componentsOf(sf)
  const stem = basename(sf.getFilePath()).replace(/\.tsx?$/, '')
  const exported = comps.filter((c) => c.exportedAt)
  return ((wanted ? comps.find((c) => c.name === wanted) : undefined) ?? exported.find((c) => c.name === stem) ?? (exported.length === 1 ? exported[0] : undefined))?.name
}

/**
 * Switches the importers of the components about to be converted to the default export (the view's component; the
 * named export becomes the code-behind class). Run once for the whole batch BEFORE converting: a file converted in
 * the same batch then already imports its converted neighbours by default. Returns the other files changed (path →
 * text); the files of the batch are left out (they are replaced by their views).
 */
export function rewriteImporters(cfg: MigrateConfig, targets: ReadonlyArray<{ sf: SourceFile; component: string }>): Record<string, string> {
  const batch = new Set(targets.map((t) => t.sf.getFilePath()))
  const changed = new Set<SourceFile>()
  for (const { sf, component } of targets) {
    const comp = componentsOf(sf).find((c) => c.name === component)
    if (!comp || comp.exported === 'default' || comp.exported === 'both') continue
    const noExt = sf.getFilePath().replace(/\.tsx?$/, '')
    for (const other of cfg.project.getSourceFiles()) {
      if (other === sf) continue
      for (const imp of other.getImportDeclarations()) {
        const target2 = imp.getModuleSpecifierSourceFile()
        if (!target2 || target2.getFilePath().replace(/\.tsx?$/, '') !== noExt) continue
        const named = imp.getNamedImports().find((n) => n.getName() === component)
        if (!named) continue
        const local = named.getAliasNode()?.getText() ?? component
        named.remove()
        if (!imp.getDefaultImport()) imp.setDefaultImport(local)
        if (!imp.getNamedImports().length && imp.getImportClause()?.getNamedBindings()) imp.removeNamedImports()
        changed.add(other)
      }
    }
  }
  const edits: Record<string, string> = {}
  for (const f of changed) if (!batch.has(f.getFilePath())) edits[f.getFilePath()] = f.getFullText()
  return edits
}

export { pascal }

/** A readable member name for an expression (`error` → `show_error`, `tab === 'profile'` → `show_tab_profile`). */
function nameFor(e: ts.Node, prefix: string): string {
  const words = (e.getText().match(/[A-Za-z][A-Za-z0-9]*/g) ?? []).filter((w) => !['this', 'props', 'true', 'false', 'null', 'undefined', 'length'].includes(w))
  const tail = snake(words.slice(0, 3).join('_'))
  return tail ? `${prefix}_${tail}`.slice(0, 48) : prefix
}

/** Leaves out the literal attributes equal to their property's default (`Role="Body"`, `Direction="TopDown"`). */
function dropDefaults(m: Migration, n: XNode): void {
  const info = m.cfg.registry.byElementName(n.el)
  if (info) n.attrs = n.attrs.filter((a) => a.value.startsWith('{') || info.defaults.get(a.name) !== a.value || a.name === 'Text')
  for (const c of n.children) dropDefaults(m, c)
}

/** Whether classes make a flex or grid box (its children are items: a text run of its own is an item too). */
function isFlexBox(className: string | undefined): boolean {
  return !!className && /(^|\s)(flex|inline-flex|grid|inline-grid)(\s|$)/.test(className)
}

/**
 * The children of an element. In a flex / grid box, adjacent text children (`<Icon/> {label}`: a space and a label)
 * form ONE anonymous item in the browser, so they become one text run (separate runs would be separate items, with
 * the box's gap between them); a run of spaces alone is no item there and is dropped.
 */
function convertChildren(m: Migration, children: readonly ts.JsxChild[], ctx: JsxCtx, flexBox: boolean): XNode[] {
  if (!flexBox) return children.flatMap((c) => convertChild(m, c, ctx))
  const out: XNode[] = []
  let run: ts.JsxChild[] = []
  const flush = (): void => {
    if (!run.length) return
    const text = run.every((c) => ts.isJsxText(c)) ? run.map((c) => decodeEntities(cleanJsxText((c as ts.JsxText).text))).join('') : undefined
    if (text !== undefined && !text.trim()) {
      run = []
      return
    }
    if (run.length === 1) out.push(...convertChild(m, run[0], ctx))
    else {
      m.stats.elements++
      m.stats.mapped++
      const n: XNode = { el: 'Label', attrs: [], children: [] }
      attr(n, 'HtmlTag', 'Span')
      attr(n, 'InheritFontSize', 'true')
      attr(n, 'Overflow', 'Wrap')
      attr(n, 'Text', textValue(m, run, ctx, 'text'))
      out.push(n)
    }
    run = []
  }
  for (const c of children) {
    const textLike = ts.isJsxText(c) || (ts.isJsxExpression(c) && !!c.expression && !containsJsx(c.expression) && !isListOrCondition(c.expression) && (isTextValue(m, c.expression) || !!resText(m, c.expression, ctx)))
    if (textLike) run.push(c)
    else {
      flush()
      out.push(...convertChild(m, c, ctx))
    }
  }
  flush()
  return out
}

function isListOrCondition(e: ts.Expression): boolean {
  const x = skipParens(e)
  return ts.isCallExpression(x) && ts.isPropertyAccessExpression(x.expression) && x.expression.name.text === 'map'
}

/** Whether an expression's value is text (a string, a number, a boolean React prints nothing for). */
function isTextValue(m: Migration, e: ts.Expression): boolean {
  try {
    const t = m.checker.getTypeAtLocation(e)
    const text = ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.BooleanLike | ts.TypeFlags.Any
    const parts = t.isUnion() ? t.types : [t]
    return parts.every((p) => !!(p.flags & text))
  } catch {
    return true
  }
}

/** The context of a subtree shown only when `cond` (a class expression) holds. */
function guarded(ctx: JsxCtx, cond: string): JsxCtx {
  return { ...ctx, guards: [...(ctx.guards ?? []), cond] }
}

/** The Lucide icon name of `<Plus size={16}/>` or `Plus` (imported from lucide-react), if it is one. */
function lucideName(m: Migration, e: ts.Node): string | undefined {
  const x = skipParens(e)
  const tag = ts.isJsxSelfClosingElement(x) ? x.tagName : ts.isIdentifier(x) ? x : undefined
  if (!tag || !ts.isIdentifier(tag)) return undefined
  const imp = importOf(m, tag)
  return imp?.module === 'lucide-react' ? imp.name.replace(/Icon$/, '') : undefined
}

/** Whether some code text holds JSX (then its file must be a `.tsx`). */
function containsJsxText(text: string): boolean {
  const sf = ts.createSourceFile('x.tsx', `const __x = () => {\n${text}\n}`, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX)
  let found = false
  const visit = (n: ts.Node): void => {
    if (found) return
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) found = true
    else ts.forEachChild(n, visit)
  }
  visit(sf)
  return found
}

/** The negation of a boolean expression as a value (`Enabled` from `disabled={busy}`): a literal, or one getter. */
function invertExpr(m: Migration, e: ts.Expression, ctx: JsxCtx, base: string): string {
  const x = skipParens(e)
  if (x.kind === ts.SyntaxKind.TrueKeyword) return 'false'
  if (x.kind === ts.SyntaxKind.FalseKeyword) return 'true'
  return binding(m, x, `!(${m.rewrite(x, { rows: ctx.rows })})`, ctx, base)
}

/**
 * Whether a change handler only writes the new value into `setter`'s state: `setX` itself, `(v) => setX(v)` for a value
 * callback, `(e) => setX(e.target.value)` (or `.checked`) for an event one.
 */
function isPlainSetterCall(m: Migration, e: ts.Expression, setter: Local, args: string | undefined): boolean {
  const x = skipParens(e)
  if (ts.isIdentifier(x)) return m.localOf(x) === setter
  if (!(ts.isArrowFunction(x) || ts.isFunctionExpression(x)) || x.parameters.length !== 1 || !ts.isIdentifier(x.parameters[0].name)) return false
  const p = x.parameters[0].name.text
  let body: ts.Node = x.body
  if (ts.isBlock(body)) {
    if (body.statements.length !== 1 || !ts.isExpressionStatement(body.statements[0])) return false
    body = body.statements[0].expression
  }
  const call = skipParens(body)
  if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || m.localOf(call.expression) !== setter || call.arguments.length !== 1) return false
  const arg = call.arguments[0].getText().replace(/\s+/g, '')
  if (args === 'value') return arg === p
  return arg === `${p}.target.value` || arg === `${p}.target.checked` || arg === `${p}.currentTarget.value`
}
