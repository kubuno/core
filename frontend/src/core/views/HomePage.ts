/**
 * Code-behind of `HomePage.kbview` (converted from `HomePage.tsx` by @kubuno/views-migrate).
 */
import { bind, type MouseEventArgs } from '@kubuno/views'
import { useNavigate } from 'react-router-dom'
import { formatDate } from "../intl/datetime"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "../store/authStore"
import { useModulesStore } from "../store/modulesStore"
import { useToolbarStore } from "../store/toolbarStore"
import { WidgetRegistry } from "../widgets/WidgetRegistry"
import GridDashboard from "../widgets/GridDashboard"
import { useFavoriteApps } from "../hooks/useFavoriteApps"
import { appNavMemory } from "../store/appNavMemory"
import { useIsMobile } from "@ui"

import { ViewBase } from './HomePage.kbview'
import * as __parts from './HomePage.parts.tsx'

export class HomePage extends ViewBase {
  @bind accessor editMode = false
  tr!: HomePageStores['t']
  user!: HomePageStores['user']
  activeModules!: HomePageStores['activeModules']
  favApps!: HomePageStores['favApps']
  isMobile!: boolean
  navigate!: ReturnType<typeof useNavigate>

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t }       = useTranslation()
    const { user }          = useAuthStore()
    const { activeModules } = useModulesStore()
    const favApps = useFavoriteApps()
    const isMobile = useIsMobile()
    useEffect(() => {
      const { register, unregister } = useToolbarStore.getState()
      register({ moduleId: 'home', routePrefix: '/', padding: 24 })
      return () => unregister('home')
    }, [])
    return { t, user, activeModules, favApps, isMobile }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, user: s.user, activeModules: s.activeModules, favApps: s.favApps, isMobile: s.isMobile })
    this.navigate = useNavigate()
  }

  get activeIds(): Set<string> {
    return this.memo('activeIds', [this.activeModules], () => new Set(this.activeModules.map(m => m.module_id)))
  }

  get allWidgets() {
    return this.memo('allWidgets', [this.activeIds], () => WidgetRegistry.getAll().filter(w => w.moduleId === 'core' || this.activeIds.has(w.moduleId)))
  }

  get name(): string {
    return this.user?.display_name?.split(' ')[0] ?? this.user?.username ?? this.tr('home.you')
  }

  get h(): number {
    return new Date().getHours()
  }

  get greetingKey(): "home.g_night" | "home.g_morning" | "home.g_afternoon" | "home.g_evening" {
    return this.h < 6 ? 'home.g_night' : this.h < 12 ? 'home.g_morning' : this.h < 18 ? 'home.g_afternoon' : 'home.g_evening'
  }

  get show_case_1() {
    return !!(this.allWidgets.length === 0)
  }

  get show_main() {
    return !(this.allWidgets.length === 0)
  }

  get h1_text() {
    if (!(!(this.allWidgets.length === 0))) return undefined as never
    return this.tr(this.greetingKey, { name: this.name })
  }

  get p_text() {
    if (!(!(this.allWidgets.length === 0))) return undefined as never
    return formatDate(new Date(), 'weekdayDate')
  }

  get show_edit_mode_is_mobile_fav_apps() {
    if (!(!(this.allWidgets.length === 0))) return undefined as never
    return !this.editMode && !this.isMobile && this.favApps.length > 0
  }

  /** A part of the screen still written in React (<app.Icon> is no .kbview element (a local or dynamic component)). */
  get Part1() {
    if (!(!(this.allWidgets.length === 0)) || !(!this.editMode && !this.isMobile && this.favApps.length > 0)) return undefined as never
    return __parts.Part1
  }

  /** The rows of the Repeater over `favApps`. */
  get rows_fav_apps() {
    return this.memo('rows_fav_apps', [this.favApps, this.allWidgets, this.editMode, this.isMobile], () => {
      if (!(!(this.allWidgets.length === 0)) || !(!this.editMode && !this.isMobile && this.favApps.length > 0)) return undefined as never
      return this.favApps.map((app) => {
      return { app, href: ((!(this.allWidgets.length === 0)) && (!this.editMode && !this.isMobile && this.favApps.length > 0)) ? (appNavMemory.get(app.id) ?? app.landing ?? app.path) : undefined, part1_props: ((!(this.allWidgets.length === 0)) && (!this.editMode && !this.isMobile && this.favApps.length > 0)) ? ({ app: app }) : undefined, key: app.id }
    })
    })
  }

  get show_not_edit_mode() {
    if (!(!(this.allWidgets.length === 0))) return undefined as never
    return !(this.editMode)
  }

  /** `<GridDashboard>`, rendered by a ReactHost. */
  get GridDashboard() {
    if (!(!(this.allWidgets.length === 0))) return undefined as never
    return GridDashboard
  }

  get grid_dashboard_props() {
    return this.memo('grid_dashboard_props', [this.allWidgets, this.activeIds, this.editMode], () => {
      if (!(!(this.allWidgets.length === 0))) return undefined as never
      return ({ allWidgets: this.allWidgets, activeIds: this.activeIds, editMode: this.editMode })
    })
  }

  link_label_click(_sender: unknown, _args: MouseEventArgs) {
    this.navigate("/admin")
  }

  panel_click(_sender: unknown, args: MouseEventArgs) {
    const { app } = args.row as RowOf_rows_fav_apps
    this.navigate(appNavMemory.get(app.id) ?? app.landing ?? app.path)
  }

  button_click(_sender: unknown, _args: MouseEventArgs) {
    if (!(!(this.allWidgets.length === 0)) || !(this.editMode)) return undefined as never
    this.editMode = false
  }

  button_click2(_sender: unknown, _args: MouseEventArgs) {
    if (!(!(this.allWidgets.length === 0)) || !(!(this.editMode))) return undefined as never
    this.editMode = true
  }

}

type RowOf_rows_fav_apps = HomePage['rows_fav_apps'][number]

/** What `useStores()` gives (the types of the fields it fills). */
export type HomePageStores = ReturnType<HomePage['useStores']>

export default HomePage.component()
