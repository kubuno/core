/**
 * The web element registry read backwards: which `.kbview` element renders a given React component, and which
 * `.kbview` property / event a React prop corresponds to (`prop_map` / `event_map` of `kbview-registry.web.json`
 * and the project registries). WEB-VIEWS.md §6.2: "`@ui` elements → `.kbview` elements by reverse registry lookup
 * (`propMap`, lower-case enums → PascalCase, `children` → `Text` or content)".
 */
import { readFileSync } from 'node:fs'

/** One `prop_map` entry. */
export interface PropTarget {
  prop?: string
  runtime?: string
  field?: string
  convert?: string
  values?: Record<string, unknown>
  change?: string
}

/** One `event_map` entry. */
export interface EventSource {
  prop?: string
  dom?: string
  runtime?: string
  field?: string
  args?: string
}

interface RegistryComponent {
  name: string
  children?: string
  properties?: Array<{ name: string; kind: unknown; default?: string | null; bindable?: boolean }>
  events?: Array<{ name: string }>
  web?: {
    module?: string | null
    export?: string | null
    prop_map?: Record<string, PropTarget>
    event_map?: Record<string, EventSource>
    content?: string | null
    alternates?: Array<{ module: string; export: string; when?: Record<string, string> }>
  } | null
}

/** A `.kbview` element as seen from the React component it renders. */
export interface ElementInfo {
  name: string
  module: string
  export: string
  /** `children` model of the element (`None`, `SingleWidget`, `List`). */
  children: string
  /** The React prop receiving the element's children (content), if any. */
  content?: string
  /** React prop → `.kbview` property (direct `prop` targets only), with the reverse value map of enums. */
  props: Map<string, { name: string; values?: Map<string, string>; convert?: string; change?: string }>
  /** React prop → `.kbview` event (`prop` sources). */
  events: Map<string, { name: string; args?: string }>
  /** `.kbview` property names (any target), for properties the codemod writes itself (`Class`, `Visible`…). */
  propertyNames: Set<string>
  /** `.kbview` event names. */
  eventNames: Set<string>
  /** Default values of the properties (to leave out what equals the default). */
  defaults: Map<string, string>
}

export class Registry {
  private readonly byExport = new Map<string, ElementInfo>()
  private readonly byName = new Map<string, ElementInfo>()

  /** Loads registries (host first, then project registries, whose `./x` modules are relative to `base`). */
  static load(files: ReadonlyArray<{ file: string; rewriteModule?: (m: string) => string }>): Registry {
    const r = new Registry()
    for (const { file, rewriteModule } of files) {
      const doc = JSON.parse(readFileSync(file, 'utf8')) as { components: RegistryComponent[] }
      for (const c of doc.components) r.add(c, rewriteModule)
    }
    return r
  }

  private add(c: RegistryComponent, rewrite?: (m: string) => string): void {
    const w = c.web
    const props = new Map<string, { name: string; values?: Map<string, string>; convert?: string; change?: string }>()
    const events = new Map<string, { name: string; args?: string }>()
    for (const [name, t] of Object.entries(w?.prop_map ?? {})) {
      if (!t.prop || props.has(t.prop)) continue
      const values = t.values ? new Map(Object.entries(t.values).map(([k, v]) => [String(v), k])) : undefined
      props.set(t.prop, { name, values, convert: t.convert, change: t.change })
    }
    for (const [name, s] of Object.entries(w?.event_map ?? {})) {
      if (s.prop && !events.has(s.prop)) events.set(s.prop, { name, args: s.args })
    }
    const defaults = new Map<string, string>()
    for (const p of c.properties ?? []) if (p.default !== undefined && p.default !== null) defaults.set(p.name, String(p.default))
    const info: ElementInfo = {
      name: c.name,
      module: w?.module ? (rewrite ? rewrite(w.module) : w.module) : '',
      export: w?.export ?? '',
      children: c.children ?? 'None',
      content: w?.content ?? undefined,
      props,
      events,
      propertyNames: new Set([...(c.properties ?? []).map((p) => p.name), ...Object.keys(w?.prop_map ?? {})]),
      eventNames: new Set((c.events ?? []).map((e) => e.name)),
      defaults,
    }
    this.byName.set(c.name, info)
    if (w?.module && w.export) {
      const key = `${info.module}#${w.export}`
      // The first element rendering a component is its canonical one (TextField over its alternates).
      if (!this.byExport.has(key)) this.byExport.set(key, info)
    }
  }

  /** The element rendering export `name` of `module` (`@ui#Button` → `Button`). */
  element(module: string, name: string): ElementInfo | undefined {
    return this.byExport.get(`${module}#${name}`)
  }

  byElementName(name: string): ElementInfo | undefined {
    return this.byName.get(name)
  }
}
