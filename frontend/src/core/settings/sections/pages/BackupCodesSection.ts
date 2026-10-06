/**
 * Code-behind of `BackupCodesSection.kbcontrol` (converted from `BackupCodesSection.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { api } from "../../../api/client"
import { BackupCodesPanel } from "../controls/BackupCodesPanel"

import { ViewBase } from './BackupCodesSection.kbcontrol'

export interface BackupCodeStatus {
  remaining: number
  total: number
  generated_at: string | null
  low_threshold: number
  low: boolean
}

export class BackupCodesSection extends ViewBase {
  @bind accessor status: BackupCodeStatus | null = null
  @bind accessor fresh: string[] | null = null
  @bind accessor busy = false
  @bind accessor error = ''
  tr!: BackupCodesSectionStores['t']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const t = this.tr
    const load = useCallback(async () => {
      try {
        const { data } = await api.get<BackupCodeStatus>('/me/2fa/backup-codes')
        this.status = data
      } catch (err: unknown) {
        this.error = (err as { message?: string })?.message ?? t('settings.error')
      }
    }, [t])
    useEffect(() => { void load() }, [load])
    return { load }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
    this.useHooks()
  }

  get show_case_1() {
    return !!(this.fresh)
  }

  /** `<BackupCodesPanel>`, rendered by a ReactHost. */
  get BackupCodesPanel() {
    if (!(this.fresh)) return undefined as never
    return BackupCodesPanel
  }

  get backup_codes_panel_props() {
    return this.memo('backup_codes_panel_props', [this.fresh], () => {
      if (!(this.fresh)) return undefined as never
      return ({ codes: this.fresh, onDone: () => this.fresh = null } as React.ComponentProps<typeof BackupCodesPanel>)
    })
  }

  get show_main() {
    return !(this.fresh)
  }

  get show_status_status_low() {
    if (!(!(this.fresh))) return undefined as never
    return !!(this.status && this.status.low)
  }

  get bc_low_desc_count() {
    if (!(!(this.fresh)) || !(this.status && this.status.low)) return undefined as never
    return this.status.remaining
  }

  get bc_remaining_count() {
    if (!(!(this.fresh))) return undefined as never
    return this.status?.remaining ?? 0
  }

  get bc_remaining_total() {
    if (!(!(this.fresh))) return undefined as never
    return this.status?.total ?? 0
  }

  get show_error() {
    if (!(!(this.fresh))) return undefined as never
    return !!(this.error)
  }

  async regenerate() {
    this.busy = true
    this.error = ''
    try {
      const { data } = await api.post<{ codes: string[]; status: BackupCodeStatus }>(
        '/me/2fa/backup-codes',
      )
      this.fresh = data.codes
      this.status = data.status
    } catch (err: unknown) {
      this.error = (err as { message?: string })?.message ?? this.tr('settings.error')
    } finally {
      this.busy = false
    }
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type BackupCodesSectionStores = ReturnType<BackupCodesSection['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type BackupCodesSectionHooks = ReturnType<BackupCodesSection['useHooks']>

export default BackupCodesSection.component()
