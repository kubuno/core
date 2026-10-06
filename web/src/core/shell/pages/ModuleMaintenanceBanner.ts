/**
 * Code-behind of `ModuleMaintenanceBanner.kbcontrol` (converted from `ModuleMaintenanceBanner.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { useModuleMaintenance } from "../maintenanceStore"

import { ViewBase } from './ModuleMaintenanceBanner.kbcontrol'

export type ModuleMaintenanceBannerProps = { moduleId: string }

export class ModuleMaintenanceBanner extends ViewBase {
  tr!: ModuleMaintenanceBannerStores['t']
  notice!: ModuleMaintenanceBannerHooks['notice']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const notice = useModuleMaintenance(this.props.moduleId)
    this.publish({ notice })
    return { notice }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
    const h = this.useHooks()
    this.publish({ notice: h.notice })
  }

  get show_case_1() {
    return !!(!this.notice)
  }

  get show_main() {
    return !(!this.notice)
  }

  get callout_text() {
    if (!(!(!this.notice))) return undefined as never
    return this.notice.message || this.tr('shell.maintenance_module_body')
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleMaintenanceBannerStores = ReturnType<ModuleMaintenanceBanner['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type ModuleMaintenanceBannerHooks = ReturnType<ModuleMaintenanceBanner['useHooks']>

export default ModuleMaintenanceBanner.component()
