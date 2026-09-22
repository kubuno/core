import { useTranslation } from 'react-i18next'
import { Callout } from '@ui'
import { useGlobalMaintenance, useModuleMaintenance } from './maintenanceStore'

/**
 * Instance-wide maintenance banner, shown at the top of the shell while a global
 * database operation runs (engine switch, schema-prefix change, restore). It is
 * a persistent Callout, never a fleeting toast, and disappears on its own the
 * moment the operation ends (the notice is lifted over WebSocket or on reload).
 */
export function GlobalMaintenanceBanner() {
  const { t } = useTranslation()
  const notice = useGlobalMaintenance()
  if (!notice) return null
  return (
    <div className="px-1 pt-1 no-print">
      <Callout variant="warning" title={t('shell.maintenance_global_title')}>
        {notice.message || t('shell.maintenance_global_body')}
      </Callout>
    </div>
  )
}

/**
 * Per-module maintenance banner, shown at the top of the module area while a
 * database operation scoped to the displayed module runs (its database is being
 * switched, synced or migrated). Disappears automatically when the notice lifts.
 */
export function ModuleMaintenanceBanner({ moduleId }: { moduleId: string }) {
  const { t } = useTranslation()
  const notice = useModuleMaintenance(moduleId)
  if (!notice) return null
  return (
    <div className="px-3 pt-2 no-print">
      <Callout variant="warning" title={t('shell.maintenance_module_title')}>
        {notice.message || t('shell.maintenance_module_body')}
      </Callout>
    </div>
  )
}
