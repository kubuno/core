/**
 * Code-behind of `GlobalMaintenanceBanner.kbview` (converted from `GlobalMaintenanceBanner.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { useGlobalMaintenance } from "./maintenanceStore"

import { ViewBase } from './GlobalMaintenanceBanner.kbview'

export class GlobalMaintenanceBanner extends ViewBase {
  tr!: GlobalMaintenanceBannerStores['t']
  notice!: GlobalMaintenanceBannerStores['notice']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const notice = useGlobalMaintenance()
    return { t, notice }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, notice: s.notice })
  }

  get show_case_1() {
    return !!(!this.notice)
  }

  get show_main() {
    return !(!this.notice)
  }

  get callout_text() {
    if (!(!(!this.notice))) return undefined as never
    return this.notice.message || this.tr('shell.maintenance_global_body')
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type GlobalMaintenanceBannerStores = ReturnType<GlobalMaintenanceBanner['useStores']>

export default GlobalMaintenanceBanner.component()
