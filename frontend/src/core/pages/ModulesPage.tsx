import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { useModulesStore } from '../store/modulesStore'
import { WaffleAppRegistry, type WaffleApp } from '../registry/WaffleAppRegistry'

// Full-page "all apps" grid. Mirrors the WaffleMenu dropdown (which is hidden on
// mobile), so the bottom MobileNav "Modules" button has a real destination that
// lists every active module/sub-module. Standalone apps first, then sub-modules
// grouped under their parent module — same classification as the WaffleMenu.
export default function ModulesPage() {
  const { t }             = useTranslation()
  const { activeModules } = useModulesStore()

  // Flatten active modules → apps, tagging each with its parent module (same as
  // HeaderActions) so we can group sub-modules (Office, PaintSharp…).
  const allApps: WaffleApp[] = activeModules.flatMap((m) => {
    const entry = WaffleAppRegistry.get(m.module_id)
    return entry ? entry.apps.map(a => ({ ...a, moduleId: entry.moduleId, moduleLabel: entry.label })) : []
  })

  const byLabel = (x: WaffleApp, y: WaffleApp) => x.label.localeCompare(y.label)
  const moduleAppCount = allApps.reduce<Record<string, number>>((acc, a) => {
    const mid = a.moduleId ?? a.id; acc[mid] = (acc[mid] ?? 0) + 1; return acc
  }, {})
  const moduleGroups: { moduleId: string; label: string; apps: WaffleApp[] }[] = []
  const standaloneApps: WaffleApp[] = []
  for (const a of allApps) {
    const mid = a.moduleId ?? a.id
    if ((moduleAppCount[mid] ?? 1) > 1) {
      let g = moduleGroups.find(x => x.moduleId === mid)
      if (!g) { g = { moduleId: mid, label: a.moduleLabel ?? mid, apps: [] }; moduleGroups.push(g) }
      g.apps.push(a)
    } else {
      standaloneApps.push(a)
    }
  }
  moduleGroups.forEach(g => g.apps.sort(byLabel))
  moduleGroups.sort((a, b) => a.label.localeCompare(b.label))
  standaloneApps.sort(byLabel)

  const renderCell = (app: WaffleApp) => (
    <Link
      key={app.id}
      to={app.path}
      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-surface-2 transition-colors text-center"
    >
      <app.Icon size={44} className="text-text-secondary" />
      <span className="text-xs text-text-secondary leading-tight">{app.label}</span>
    </Link>
  )

  if (allApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-surface-2 flex items-center justify-center">
          <LayoutGrid size={40} className="text-text-tertiary" />
        </div>
        <div>
          <h1 className="text-xl font-medium text-text-primary mb-2">{t('modules.title', { defaultValue: 'Modules' })}</h1>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">
            {t('modules.empty', { defaultValue: 'Aucun module installé pour le moment.' })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-medium text-text-primary mb-5">{t('modules.title', { defaultValue: 'Modules' })}</h1>

      {/* Apps autonomes */}
      {standaloneApps.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 mb-4">
          {standaloneApps.map(renderCell)}
        </div>
      )}

      {/* Sous-modules regroupés par module parent */}
      {moduleGroups.map(group => (
        <div key={group.moduleId} className="mb-4">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
            {group.label}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
            {group.apps.map(renderCell)}
          </div>
        </div>
      ))}
    </div>
  )
}
