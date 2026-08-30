import { useTranslation } from 'react-i18next'
import { useModulesStore } from '../store/modulesStore'
import { usePrivileges } from '../authz/usePrivileges'
import { WaffleAppRegistry, type WaffleApp } from '../registry/WaffleAppRegistry'
import { AdminLogo } from '../admin/AdminLogo'

/**
 * The full set of tiles the app launcher shows, shared by the desktop header
 * and the mobile FAB so neither can drift from the other.
 *
 * It is the active modules' apps (each tagged with its parent module so the
 * launcher can group sub-modules), plus — for anyone who may enter the
 * administration surface — a tile that opens the console. The admin tile is not
 * a module: it is grafted here, exactly as the console's own menu grafts the
 * marketplace link, and only when `isAdmin` grants it, so an ordinary user
 * never sees a door that would only refuse them.
 */
export function useWaffleApps(): WaffleApp[] {
  const { t }             = useTranslation()
  const { activeModules } = useModulesStore()
  const { isAdmin }       = usePrivileges()

  const apps = activeModules.flatMap((m) => {
    const entry = WaffleAppRegistry.get(m.module_id)
    // moduleId/moduleLabel are attached so the launcher can group a module's
    // sub-modules together (Office, PaintSharp…).
    return entry ? entry.apps.map(a => ({ ...a, moduleId: entry.moduleId, moduleLabel: entry.label })) : []
  })

  if (isAdmin) {
    apps.push({
      id:          'core-admin',
      label:       t('user.admin'),
      Icon:        AdminLogo,
      path:        '/admin',
      moduleId:    'core-admin',
      moduleLabel: t('user.admin'),
    })
  }

  return apps
}
