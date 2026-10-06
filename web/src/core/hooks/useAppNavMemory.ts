import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useModulesStore } from '../store/modulesStore'
import { WaffleAppRegistry } from '../registry/WaffleAppRegistry'
import { appNavMemory } from '../store/appNavMemory'

/**
 * Record the last visited location of the current application (per tab) so the
 * app launcher can return the user exactly where they left off. The application
 * is resolved by the longest matching waffle-app path prefix, so a sub-module
 * (e.g. /paintsharp/apex/123) is remembered under its own id.
 */
export function useAppNavMemory(): void {
  const { pathname, search, hash } = useLocation()
  // Waffle apps register on bundle load; re-resolve once that lands so the
  // current location is captured even right after a hard reload.
  const loadedVersion = useModulesStore((s) => s.loadedVersion)

  useEffect(() => {
    const resolved = WaffleAppRegistry.resolveByPath(pathname)
    if (!resolved) return
    appNavMemory.set(resolved.subId, pathname + search + hash)
  }, [pathname, search, hash, loadedVersion])
}
