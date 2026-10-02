/**
 * What the runtime resolves at run time rather than through imports: components of interpreted plans (the
 * designer's — compiled plans import theirs), Lucide icons by name, `{Res}` strings, and the elements
 * modules register at load time (`registerElements`, the module isolation rule 2: a module's own controls
 * are registered dynamically, never statically linked from another module).
 */
import type { ComponentType } from 'react'

type AnyComponent = ComponentType<Record<string, unknown>>
type IconComponent = ComponentType<{ size?: number; color?: string; className?: string }>

const modules = new Map<string, Readonly<Record<string, unknown>>>()
let iconResolver: (name: string) => IconComponent | undefined = () => undefined
let resourceResolver: (key: string, set?: string) => string = (key) => key
let resourceVersion = 0

/**
 * Registers the exports of a module under its specifier (`'@ui'`, `'@kubuno/sdk'`, a module's own
 * `'controls'`…), for plans that name components by module/export (interpreted plans, the designer).
 */
export function registerElements(specifier: string, exports: Readonly<Record<string, unknown>>): void {
  modules.set(specifier, { ...(modules.get(specifier) ?? {}), ...exports })
}

/** The component exported as `name` by `specifier` (registered with `registerElements`). */
export function resolveComponent(specifier: string | undefined, name: string | undefined): AnyComponent | undefined {
  if (!specifier || !name) return undefined
  return modules.get(specifier)?.[name] as AnyComponent | undefined
}

/** Sets how an icon name (`Save`, `trash`) becomes a component (the host passes its `ICON_MAP` lookup). */
export function setIconResolver(resolve: (name: string) => IconComponent | undefined): void {
  iconResolver = resolve
}

export function resolveIcon(name: string): IconComponent | undefined {
  return iconResolver(name)
}

/**
 * Sets how `{Res key[, Source=set]}` resolves (the host passes i18next's `t`). Call
 * `invalidateResources()` when the language changes: every live view re-reads its strings.
 */
export function setResourceResolver(resolve: (key: string, set?: string) => string): void {
  resourceResolver = resolve
  invalidateResources()
}

export function resolveResource(key: string, set?: string): string {
  return resourceResolver(key, set)
}

const resourceListeners = new Set<() => void>()

export function invalidateResources(): void {
  resourceVersion++
  for (const l of resourceListeners) l()
}

/** @internal */
export function onResourcesChanged(listener: () => void): () => void {
  resourceListeners.add(listener)
  return () => resourceListeners.delete(listener)
}

/** @internal */
export function resourcesVersion(): number {
  return resourceVersion
}
