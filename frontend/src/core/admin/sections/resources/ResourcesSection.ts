/**
 * Code-behind of `ResourcesSection.kbview` (converted from `ResourcesSection.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { type TabDef } from "@ui"
import { usePrivileges } from "../../../authz/usePrivileges"
import { RESOURCES_MANAGE } from "./privileges"
import { paneFromParams, type ResourcePane } from "./panes"
import { adminUrlWith } from "../../adminAction"
import OverviewTab from "./OverviewTab"
import BuildingsTab from "./BuildingsTab"
import ResourcesTab from "./ResourcesTab"
import FeaturesTab from "./FeaturesTab"
import RoomStatsTab from "./RoomStatsTab"

import { ViewBase } from './ResourcesSection.kbview'
import * as __parts from './ResourcesSection.parts'

export class ResourcesSection extends ViewBase {
  tr!: ResourcesSectionStores['t']
  can!: ResourcesSectionStores['can']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t }   = useTranslation()
    const { can } = usePrivileges()
    return { t, can }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, can: s.can })
  }

  get canManage(): boolean {
    return this.can(RESOURCES_MANAGE)
  }

  get pane(): ResourcePane {
    return paneFromParams(this.props.params)
  }

  get tabs(): TabDef<ResourcePane>[] {
    return this.memo('tabs', [this.tr], () => [
    { id: 'overview',  label: this.tr('admin.res_tab_overview') },
    { id: 'buildings', label: this.tr('admin.res_tab_buildings') },
    { id: 'resources', label: this.tr('admin.res_tab_resources') },
    { id: 'features',  label: this.tr('admin.res_tab_features') },
    { id: 'room-stats', label: this.tr('admin.res_tab_room_stats') },
  ])
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.tabs, this.pane], () => ({ t: this.tr, tabs: this.tabs, pane: this.pane, go: this.go.bind(this) }))
  }

  /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  get show_pane_overview() {
    return this.pane === 'overview'
  }

  /** `<OverviewTab>`, rendered by a ReactHost. */
  get OverviewTab() {
    if (!(this.pane === 'overview')) return undefined as never
    return OverviewTab
  }

  get overview_tab_props() {
    return this.memo('overview_tab_props', [this.pane], () => {
      if (!(this.pane === 'overview')) return undefined as never
      return ({ onGo: this.go.bind(this) })
    })
  }

  get show_pane_buildings() {
    return this.pane === 'buildings'
  }

  /** `<BuildingsTab>`, rendered by a ReactHost. */
  get BuildingsTab() {
    if (!(this.pane === 'buildings')) return undefined as never
    return BuildingsTab
  }

  get buildings_tab_props() {
    return this.memo('buildings_tab_props', [this.canManage, this.pane], () => {
      if (!(this.pane === 'buildings')) return undefined as never
      return ({ canManage: this.canManage })
    })
  }

  get show_pane_resources() {
    return this.pane === 'resources'
  }

  /** `<ResourcesTab>`, rendered by a ReactHost. */
  get ResourcesTab() {
    if (!(this.pane === 'resources')) return undefined as never
    return ResourcesTab
  }

  get resources_tab_props() {
    return this.memo('resources_tab_props', [this.canManage, this.pane], () => {
      if (!(this.pane === 'resources')) return undefined as never
      return ({ canManage: this.canManage })
    })
  }

  get show_pane_features() {
    return this.pane === 'features'
  }

  /** `<FeaturesTab>`, rendered by a ReactHost. */
  get FeaturesTab() {
    if (!(this.pane === 'features')) return undefined as never
    return FeaturesTab
  }

  get features_tab_props() {
    return this.memo('features_tab_props', [this.canManage, this.pane], () => {
      if (!(this.pane === 'features')) return undefined as never
      return ({ canManage: this.canManage })
    })
  }

  get show_pane_room_stats() {
    return this.pane === 'room-stats'
  }

  /** `<RoomStatsTab>`, rendered by a ReactHost. */
  get RoomStatsTab() {
    return RoomStatsTab
  }

  go(next: ResourcePane) {
    return this.props.navigate(adminUrlWith('resources', this.props.params, { pane: next === 'overview' ? null : next }))
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type ResourcesSectionStores = ReturnType<ResourcesSection['useStores']>

export default ResourcesSection.component()
