/**
 * Code-behind of `HolidaysSection.kbview` (converted from `HolidaysSection.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { type TabDef } from "@ui"
import { usePrivileges } from "../../../authz/usePrivileges"
import type { AdminSectionProps } from "../registry"
import { adminUrlWith } from "../../adminAction"
import { HOLIDAYS_MANAGE } from "./privileges"
import CalendarsTab from "./CalendarsTab"
import CalendarDetail from "./CalendarDetail"
import UnitsTab from "./UnitsTab"
import OverviewBar from "./OverviewBar"

import { ViewBase } from './HolidaysSection.kbview'
import * as __parts from './HolidaysSection.parts'

type Pane = 'calendars' | 'units'

export type { AdminSectionProps }

export class HolidaysSection extends ViewBase {
  tr!: HolidaysSectionStores['t']
  can!: HolidaysSectionStores['can']

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
    return this.can(HOLIDAYS_MANAGE)
  }

  get calendarId(): string | null {
    return this.props.params.get('calendar')
  }

  get pane(): Pane {
    return this.props.params.get('pane') === 'units' ? 'units' : 'calendars'
  }

  get tabs(): TabDef<Pane>[] {
    return this.memo('tabs', [this.tr], () => [
    { id: 'calendars', label: this.tr('admin.hol_tab_territories') },
    { id: 'units',     label: this.tr('admin.hol_tab_units') },
  ])
  }

  get show_calendar_id() {
    return !this.calendarId
  }

  /** `<OverviewBar>`, rendered by a ReactHost. */
  get OverviewBar() {
    if (!(!this.calendarId)) return undefined as never
    return OverviewBar
  }

  get overview_bar_props() {
    return this.memo('overview_bar_props', [this.canManage, this.calendarId], () => {
      if (!(!this.calendarId)) return undefined as never
      return ({ canManage: this.canManage })
    })
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.tabs, this.pane, this.memo, this.props, this.calendarId], () => {
      if (!(!this.calendarId)) return undefined as never
      return ({ t: this.tr, tabs: this.tabs, pane: this.pane, go: this.memo("go:bound", [], () => this.go.bind(this)) })
    })
  }

  /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
  get Part1() {
    if (!(!this.calendarId)) return undefined as never
    return __parts.Part1
  }

  get show_calendar_id2() {
    return !!(this.calendarId)
  }

  get show_not_calendar_id() {
    return !(this.calendarId)
  }

  /** `<CalendarDetail>`, rendered by a ReactHost. */
  get CalendarDetail() {
    if (!(this.calendarId)) return undefined as never
    return CalendarDetail
  }

  get calendar_detail_props() {
    return this.memo('calendar_detail_props', [this.calendarId, this.canManage, this.props], () => {
      if (!(this.calendarId)) return undefined as never
      return ({ calendarId: this.calendarId, canManage: this.canManage, onOpenCalendar: id => this.go('calendars', id) } as React.ComponentProps<typeof CalendarDetail>)
    })
  }

  get show_pane_units() {
    if (!(!(this.calendarId))) return undefined as never
    return this.pane === 'units'
  }

  get show_not_pane_units() {
    if (!(!(this.calendarId))) return undefined as never
    return !(this.pane === 'units')
  }

  /** `<UnitsTab>`, rendered by a ReactHost. */
  get UnitsTab() {
    if (!(!(this.calendarId)) || !(this.pane === 'units')) return undefined as never
    return UnitsTab
  }

  get units_tab_props() {
    return this.memo('units_tab_props', [this.canManage, this.calendarId, this.pane], () => {
      if (!(!(this.calendarId)) || !(this.pane === 'units')) return undefined as never
      return ({ canManage: this.canManage })
    })
  }

  /** `<CalendarsTab>`, rendered by a ReactHost. */
  get CalendarsTab() {
    if (!(!(this.calendarId)) || !(!(this.pane === 'units'))) return undefined as never
    return CalendarsTab
  }

  get calendars_tab_props() {
    return this.memo('calendars_tab_props', [this.canManage, this.props, this.calendarId, this.pane], () => {
      if (!(!(this.calendarId)) || !(!(this.pane === 'units'))) return undefined as never
      return ({ canManage: this.canManage, onOpen: id => this.go('calendars', id) } as React.ComponentProps<typeof CalendarsTab>)
    })
  }

  get visible() {
    return this.memo('visible', [this.show_pane_units, this.show_not_calendar_id], () => this.show_pane_units && this.show_not_calendar_id)
  }

  get visible2() {
    return this.memo('visible2', [this.show_not_pane_units, this.show_not_calendar_id], () => this.show_not_pane_units && this.show_not_calendar_id)
  }

  go(next: Pane, calendar?: string | null) {
    return this.props.navigate(adminUrlWith('holidays', this.props.params, {
      pane:     next === 'calendars' ? null : next,
      calendar: calendar ?? null,
    }))
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type HolidaysSectionStores = ReturnType<HolidaysSection['useStores']>

export default HolidaysSection.component()
