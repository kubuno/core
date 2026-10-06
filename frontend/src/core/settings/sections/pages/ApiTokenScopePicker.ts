/**
 * Code-behind of `ApiTokenScopePicker.kbcontrol` (converted from `ApiTokenScopePicker.tsx` by @kubuno/views-migrate).
 */
import { bind, type MouseEventArgs } from '@kubuno/views'
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuthzLabels } from "../../../authz/labels"
import type { TokenScope } from "../../../types"

import { ViewBase } from './ApiTokenScopePicker.kbcontrol'
import * as __parts from './ApiTokenScopePicker.parts.tsx'

export type ApiTokenScopePickerProps = {
  scopes:   TokenScope[]
  selected: string[]
  onChange: (keys: string[]) => void
}

export class ApiTokenScopePicker extends ViewBase {
  @bind accessor query = ''
  tr!: ApiTokenScopePickerStores['t']
  domainLabel!: (domain: string) => string
  privilegeLabel!: ApiTokenScopePickerStores['privilegeLabel']
  privilegeDescription!: ApiTokenScopePickerStores['privilegeDescription']
  collapsed!: Set<string>
  setCollapsed!: ApiTokenScopePickerStores['setCollapsed']
  chosen!: Set<string>
  groups!: [string, TokenScope[]][]

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { domainLabel, privilegeLabel, privilegeDescription } = useAuthzLabels()
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    return { t, domainLabel, privilegeLabel, privilegeDescription, collapsed, setCollapsed }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const privilegeLabel = this.privilegeLabel
    const privilegeDescription = this.privilegeDescription
    const chosen = useMemo(() => new Set(this.props.selected), [this.props.selected])
    this.publish({ chosen })
    const groups = useMemo(() => {
      const needle = this.query.trim().toLowerCase()
      // Matched on the displayed wording, so a search types what the eye reads.
      const match = (s: TokenScope) =>
        !needle ||
        privilegeLabel(s).toLowerCase().includes(needle) ||
        s.key.toLowerCase().includes(needle) ||
        (privilegeDescription(s) ?? '').toLowerCase().includes(needle)
    
      const byDomain = new Map<string, TokenScope[]>()
      for (const s of this.props.scopes) {
        if (!match(s)) continue
        const list = byDomain.get(s.domain)
        if (list) list.push(s)
        else byDomain.set(s.domain, [s])
      }
      return [...byDomain.entries()]
    }, [this.props.scopes, this.query, privilegeLabel, privilegeDescription])
    this.publish({ groups })
    return { chosen, groups }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, domainLabel: s.domainLabel, privilegeLabel: s.privilegeLabel, privilegeDescription: s.privilegeDescription, collapsed: s.collapsed, setCollapsed: s.setCollapsed })
    const h = this.useHooks()
    this.publish({ chosen: h.chosen, groups: h.groups })
  }

  get show_case_1() {
    return !!(this.props.scopes.length === 0)
  }

  get show_main() {
    return !(this.props.scopes.length === 0)
  }

  get part1_props() {
    return this.memo('part1_props', [this.chosen, this.memo, this.props, this.privilegeLabel, this.tr], () => {
      if (!(!(this.props.scopes.length === 0))) return undefined as never
      return ({ chosen: this.chosen, toggle: this.memo("toggle:bound", [], () => this.toggle.bind(this)), scopes: this.props.scopes, privilegeLabel: this.privilegeLabel, t: this.tr })
    })
  }

  /** A part of the screen still written in React (<ComboBox> searchPlaceholder, width, maxHeight: no .kbview property). */
  get Part1() {
    if (!(!(this.props.scopes.length === 0))) return undefined as never
    return __parts.Part1
  }

  get show_selected() {
    if (!(!(this.props.scopes.length === 0))) return undefined as never
    return this.props.selected.length > 0
  }

  /** The rows of the Repeater over `selected`. */
  get rows_selected() {
    return this.memo('rows_selected', [this.props, this.privilegeLabel], () => {
      if (!(!(this.props.scopes.length === 0)) || !(this.props.selected.length > 0)) return undefined as never
      return this.props.selected.map((key) => {
      const scope = this.props.scopes.find((s) => s.key === key)
      return { key, scope, text: ((!(this.props.scopes.length === 0)) && (this.props.selected.length > 0)) ? (scope ? this.privilegeLabel(scope) : key) : undefined, rowKey: key }
    })
    })
  }

  get part2_props() {
    return this.memo('part2_props', [this.groups, this.chosen, this.collapsed, this.setCollapsed, this.domainLabel, this.memo, this.props, this.tr, this.privilegeLabel, this.privilegeDescription], () => {
      if (!(!(this.props.scopes.length === 0))) return undefined as never
      return ({ groups: this.groups, chosen: this.chosen, collapsed: this.collapsed, setCollapsed: this.setCollapsed, domainLabel: this.domainLabel, toggleGroup: this.memo("toggleGroup:bound", [], () => this.toggleGroup.bind(this)), t: this.tr, toggle: this.memo("toggle:bound", [], () => this.toggle.bind(this)), privilegeLabel: this.privilegeLabel, privilegeDescription: this.privilegeDescription })
    })
  }

  /** A part of the screen still written in React (a list callback destructuring its item). */
  get Part2() {
    if (!(!(this.props.scopes.length === 0))) return undefined as never
    return __parts.Part2
  }

  get show_groups() {
    if (!(!(this.props.scopes.length === 0))) return undefined as never
    return this.groups.length === 0
  }

  toggle(key: string) {
    const next = new Set(this.chosen)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    this.props.onChange([...next])
  }

  toggleGroup(keys: string[], allOn: boolean) {
    const next = new Set(this.chosen)
    for (const k of keys) {
      if (allOn) next.delete(k)
      else next.add(k)
    }
    this.props.onChange([...next])
  }

  panel_click(_sender: unknown, args: MouseEventArgs) {
    const { key } = args.row as RowOf_rows_selected
    if (!(!(this.props.scopes.length === 0)) || !(this.props.selected.length > 0)) return undefined as never
    this.toggle(key)
  }

  panel_click2(_sender: unknown, _args: MouseEventArgs) {
    if (!(!(this.props.scopes.length === 0)) || !(this.props.selected.length > 0)) return undefined as never
    this.props.onChange([])
  }

}

type RowOf_rows_selected = ApiTokenScopePicker['rows_selected'][number]

/** What `useStores()` gives (the types of the fields it fills). */
export type ApiTokenScopePickerStores = ReturnType<ApiTokenScopePicker['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type ApiTokenScopePickerHooks = ReturnType<ApiTokenScopePicker['useHooks']>

export default ApiTokenScopePicker.component()
