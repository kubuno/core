import type { ComponentType } from 'react'

export interface WaffleApp {
  id:    string
  label: string
  // Composant d'icône : une icône Lucide (monochrome, currentColor) OU un logo de
  // marque en couleur (ex. PaintsharpLogo). Les deux respectent { size, className }.
  Icon:  ComponentType<{ size?: number; className?: string }>
  path:  string
  // Renseignés au moment de l'aplatissement (HeaderActions) à partir de l'entrée de
  // module → permettent au WaffleMenu de regrouper les sous-modules par module parent.
  moduleId?:    string
  moduleLabel?: string
}

interface WaffleModuleEntry {
  moduleId: string
  label:    string
  apps:     WaffleApp[]
}

const registry = new Map<string, WaffleModuleEntry>()

export interface ResolvedApp {
  moduleId:    string
  moduleLabel: string
  subId:       string   // id de l'app/sous-module (= moduleId pour l'app racine)
  subLabel:    string   // libellé du sous-module (= moduleLabel pour l'app racine)
}

export const WaffleAppRegistry = {
  register(moduleId: string, label: string, apps: WaffleApp[]): void {
    registry.set(moduleId, { moduleId, label, apps })
  },
  get(moduleId: string): WaffleModuleEntry | undefined {
    return registry.get(moduleId)
  },
  getAll(): WaffleModuleEntry[] {
    return [...registry.values()]
  },
  /** Résout un chemin (ex. /paintsharp/apex/123) vers le module + sous-module via
   *  l'app au préfixe de chemin le plus long. `null` si aucun module ne correspond. */
  resolveByPath(pathname: string): ResolvedApp | null {
    let best: ResolvedApp | null = null
    let bestLen = -1
    for (const entry of registry.values()) {
      for (const app of entry.apps) {
        const p = app.path
        if ((pathname === p || pathname.startsWith(p + '/')) && p.length > bestLen) {
          bestLen = p.length
          best = {
            moduleId:    entry.moduleId,
            moduleLabel: entry.label,
            subId:       app.id,
            subLabel:    app.label,
          }
        }
      }
    }
    return best
  },
}
