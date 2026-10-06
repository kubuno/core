/**
 * Code-behind of `ModulesPage.kbview` (converted from `ModulesPage.tsx` by @kubuno/views-migrate).
 */
import { Fragment } from 'react'
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useModulesStore } from "../store/modulesStore"
import { WaffleAppRegistry, type WaffleApp } from "../registry/WaffleAppRegistry"

import { ViewBase } from './ModulesPage.kbview'

export class ModulesPage extends ViewBase {
  activeModules!: ModulesPageStores['activeModules']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t }             = useTranslation()
    const { activeModules } = useModulesStore()
    return { t, activeModules }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ activeModules: s.activeModules })
  }

  get allApps(): WaffleApp[] {
    return this.memo('allApps', [this.activeModules], () => this.activeModules.flatMap((m) => {
    const entry = WaffleAppRegistry.get(m.module_id)
    return entry ? entry.apps.map(a => ({ ...a, moduleId: entry.moduleId, moduleLabel: entry.label })) : []
  }))
  }

  get moduleAppCount(): Record<string, number> {
    return this.memo('moduleAppCount', [this.allApps], () => this.allApps.reduce<Record<string, number>>((acc, a) => {
    const mid = a.moduleId ?? a.id; acc[mid] = (acc[mid] ?? 0) + 1; return acc
  }, {}))
  }

  get moduleGroups(): { moduleId: string; label: string; apps: WaffleApp[] }[] {
    return this.memo('moduleGroups', [this.allApps, this.moduleAppCount], () => (() => {
      const moduleGroups: { moduleId: string; label: string; apps: WaffleApp[] }[] = []
      const standaloneApps: WaffleApp[] = []
      const byLabel = (x: WaffleApp, y: WaffleApp) => x.label.localeCompare(y.label)
      for (const a of this.allApps) {
    const mid = a.moduleId ?? a.id
    if ((this.moduleAppCount[mid] ?? 1) > 1) {
      let g = moduleGroups.find(x => x.moduleId === mid)
      if (!g) { g = { moduleId: mid, label: a.moduleLabel ?? mid, apps: [] }; moduleGroups.push(g) }
      g.apps.push(a)
    } else {
      standaloneApps.push(a)
    }
  }
      moduleGroups.forEach(g => g.apps.sort(byLabel))
      moduleGroups.sort((a, b) => a.label.localeCompare(b.label))
      return moduleGroups
    })())
  }

  get standaloneApps(): WaffleApp[] {
    return this.memo('standaloneApps', [this.allApps, this.moduleAppCount], () => (() => {
      const standaloneApps: WaffleApp[] = []
      const moduleGroups: { moduleId: string; label: string; apps: WaffleApp[] }[] = []
      const byLabel = (x: WaffleApp, y: WaffleApp) => x.label.localeCompare(y.label)
      for (const a of this.allApps) {
    const mid = a.moduleId ?? a.id
    if ((this.moduleAppCount[mid] ?? 1) > 1) {
      let g = moduleGroups.find(x => x.moduleId === mid)
      if (!g) { g = { moduleId: mid, label: a.moduleLabel ?? mid, apps: [] }; moduleGroups.push(g) }
      g.apps.push(a)
    } else {
      standaloneApps.push(a)
    }
  }
      standaloneApps.sort(byLabel)
      return standaloneApps
    })())
  }

  get show_case_1() {
    return !!(this.allApps.length === 0)
  }

  get show_main() {
    return !(this.allApps.length === 0)
  }

  get show_standalone_apps() {
    if (!(!(this.allApps.length === 0))) return undefined as never
    return this.standaloneApps.length > 0
  }

  /** `React.Fragment`: renders the elements an expression holds. */
  get Fragment() {
    return Fragment
  }

  get content_standalone_apps_map_render_cell() {
    return this.memo('content_standalone_apps_map_render_cell', [this.standaloneApps, this.memo, this.allApps], () => {
      if (!(!(this.allApps.length === 0)) || !(this.standaloneApps.length > 0)) return undefined as never
      return ({ children: this.standaloneApps.map(this.memo("renderCell:bound", [], () => this.renderCell.bind(this))) })
    })
  }

  /** The rows of the Repeater over `moduleGroups`. */
  get rows_module_groups() {
    return this.memo('rows_module_groups', [this.moduleGroups, this.allApps, this.memo], () => {
      if (!(!(this.allApps.length === 0))) return undefined as never
      return this.moduleGroups.map((group) => {
      return { group, content_group_apps_map: ((!(this.allApps.length === 0))) ? ({ children: group.apps.map(this.memo("renderCell:bound", [], () => this.renderCell.bind(this))) }) : undefined, key: group.moduleId }
    })
    })
  }

  byLabel(x: WaffleApp, y: WaffleApp) {
    return x.label.localeCompare(y.label)
  }

  renderCell(app: WaffleApp) {
    return (
    <Link
      key={app.id}
      to={app.path}
      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-surface-2 transition-colors text-center"
    >
      <app.Icon size={44} className="text-text-secondary" />
      <span className="text-xs text-text-secondary leading-tight">{app.label}</span>
    </Link>
  )
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type ModulesPageStores = ReturnType<ModulesPage['useStores']>

export default ModulesPage.component()
