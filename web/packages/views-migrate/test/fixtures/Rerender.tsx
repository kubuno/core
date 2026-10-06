import { useLocation } from 'react-router-dom'
import { create } from 'zustand'

const useVersionStore = create<{ version: number }>(() => ({ version: 0 }))
const registry = { find: (path: string) => ({ label: path.toUpperCase() }) }

/** A hook called only to render again when a registry is loaded: what is read from the registry follows it. */
export function Rerender() {
  const { pathname } = useLocation()
  useVersionStore((s) => s.version)
  const hit = registry.find(pathname)
  return <p title={hit.label}>{hit.label}</p>
}
