/**
 * Code-behind of `ClientsTab.kbcontrol` (converted from `ClientsTab.tsx` by @kubuno/views-migrate).
 */
import { bind, type MouseEventArgs } from '@kubuno/views'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next"
import { Check, Users, Monitor, Smartphone, Apple, Calendar as CalendarIcon, Folder } from "lucide-react"
import { useModulesStore } from "../../../store/modulesStore"
import { fallbackCopy } from "../../clipboard"

import { ViewBase } from './ClientsTab.kbcontrol'
import * as __parts from './ClientsTab.parts.tsx'

export class ClientsTab extends ViewBase {
  @bind accessor copied = false
  tr!: ClientsTabStores['t']
  activeModules!: ClientsTabStores['activeModules']
  navigate!: ReturnType<typeof useNavigate>

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { activeModules } = useModulesStore()
    return { t, activeModules }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, activeModules: s.activeModules })
    this.navigate = useNavigate()
  }

  get activeIds() {
    return this.memo('activeIds', [this.activeModules], () => new Set(this.activeModules.map(m => m.module_id)))
  }

  get serverUrl() {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }

  get connectors() {
    return this.memo('connectors', [this.tr, this.activeIds], () => [
    { id: 'calendar', to: '/calendar/settings', Icon: CalendarIcon, label: this.tr('settings.cli_connect_calendar', { defaultValue: 'Connectez votre agenda (CalDAV)' }) },
    { id: 'tasks',    to: '/tasks/settings',    Icon: Check,        label: this.tr('settings.cli_connect_tasks', { defaultValue: 'Connectez vos tâches (CalDAV)' }) },
    { id: 'contacts', to: '/contacts/settings', Icon: Users,        label: this.tr('settings.cli_connect_contacts', { defaultValue: 'Connectez vos contacts (CardDAV)' }) },
    { id: 'drive',    to: '/drive/settings',    Icon: Folder,       label: this.tr('settings.cli_connect_webdav', { defaultValue: 'Accédez à vos fichiers via WebDAV' }) },
  ].filter(c => this.activeIds.has(c.id)))
  }

  /** `<StoreBadge>`, rendered by a ReactHost. */
  get StoreBadge() {
    return __parts.StoreBadge
  }

  get store_badge_props() {
    return this.memo('store_badge_props', [this.tr], () => ({ href: "#", Icon: Monitor, top: this.tr('settings.cli_download', { defaultValue: 'Télécharger' }), bottom: this.tr('settings.cli_desktop', { defaultValue: 'Application bureau' }), sub: "Windows · macOS · Linux" }))
  }

  get store_badge_props2() {
    return this.memo('store_badge_props2', [this.tr], () => ({ href: "#", Icon: Smartphone, top: this.tr('settings.cli_get_on', { defaultValue: 'Disponible sur' }), bottom: "Google Play" }))
  }

  get store_badge_props3() {
    return this.memo('store_badge_props3', [this.tr], () => ({ href: "#", Icon: Smartphone, top: this.tr('settings.cli_get_on', { defaultValue: 'Disponible sur' }), bottom: "F-Droid" }))
  }

  get store_badge_props4() {
    return this.memo('store_badge_props4', [this.tr], () => ({ href: "#", Icon: Apple, top: this.tr('settings.cli_download_on', { defaultValue: 'Télécharger sur' }), bottom: "App Store" }))
  }

  get show_connectors() {
    return this.connectors.length > 0
  }

  /** The rows of the Repeater over `connectors`. */
  get rows_connectors() {
    return this.memo('rows_connectors', [this.connectors], () => {
      if (!(this.connectors.length > 0)) return undefined as never
      return this.connectors.map((c) => {
      return { c, icon: ((this.connectors.length > 0)) ? ({ c: c.Icon } as unknown as string) : undefined, text: ((this.connectors.length > 0)) ? (" " + String(c.label ?? '')) : undefined, key: c.id }
    })
    })
  }

  get show_not_copied() {
    return !(this.copied)
  }

  copy() {
    const done = () => { this.copied = true; setTimeout(() => this.copied = false, 1800) }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(this.serverUrl).then(done).catch(() => fallbackCopy(this.serverUrl, done))
    else fallbackCopy(this.serverUrl, done)
  }

  link_label_click(_sender: unknown, _args: MouseEventArgs) {
    this.navigate("/settings?tab=api-tokens")
  }

  panel_click(_sender: unknown, args: MouseEventArgs) {
    const { c } = args.row as RowOf_rows_connectors
    this.navigate(c.to)
  }

}

type RowOf_rows_connectors = ClientsTab['rows_connectors'][number]

/** What `useStores()` gives (the types of the fields it fills). */
export type ClientsTabStores = ReturnType<ClientsTab['useStores']>

export default ClientsTab.component()
