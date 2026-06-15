import { SDK_VERSION } from '@kubuno/sdk'
import type { ActiveModule } from '../types'

/**
 * Chargement À L'EXÉCUTION des bundles UI des modules.
 *
 * Le host ne nomme aucun module : il lit la liste renvoyée par le core
 * (`GET /api/v1/modules`) et importe le `frontend_entry` de chacun. Chaque
 * bundle externalise react/@ui/@kubuno/sdk, résolus par l'import map du host →
 * instances uniques partagées. Un module cassé ou incompatible est ignoré sans
 * jamais faire tomber le shell (try/catch + allSettled).
 */
const loaded = new Set<string>()

export async function loadRemoteModules(modules: ActiveModule[]): Promise<number> {
  const pending = modules.filter((m) => m.frontend_entry && !loaded.has(m.module_id))
  if (pending.length === 0) return 0
  const results = await Promise.allSettled(pending.map(loadOne))
  return results.filter((r) => r.status === 'fulfilled' && r.value).length
}

async function loadOne(m: ActiveModule): Promise<boolean> {
  const entry = m.frontend_entry as string
  loaded.add(m.module_id) // marque tôt : évite un double-chargement concurrent

  try {
    // Feuille de style du module (best-effort), injectée avant le JS.
    const cssHref = entry.replace(/entry\.js(\?.*)?$/, 'entry.css')
    if (cssHref !== entry && !document.querySelector(`link[data-kbmod="${m.module_id}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = cssHref
      link.dataset.kbmod = m.module_id
      document.head.appendChild(link)
    }

    const mod = await import(/* @vite-ignore */ entry)

    // Handshake de version : un module bâti contre un autre SDK est ignoré.
    const v = typeof mod.sdkVersion === 'number' ? mod.sdkVersion : undefined
    if (v !== undefined && v !== SDK_VERSION) {
      console.warn(`[modules] ${m.module_id} : SDK v${v} ≠ host v${SDK_VERSION} — ignoré`)
      loaded.delete(m.module_id)
      return false
    }
    if (typeof mod.register !== 'function') {
      console.warn(`[modules] ${m.module_id} : pas d'export register() — ignoré`)
      loaded.delete(m.module_id)
      return false
    }

    mod.register()
    return true
  } catch (err) {
    // Isolation : l'échec d'un module ne casse jamais le shell ni les autres.
    console.error(`[modules] ${m.module_id} : échec de chargement du bundle UI`, err)
    loaded.delete(m.module_id)
    return false
  }
}
