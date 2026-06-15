import type { ComponentType, LazyExoticComponent } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any> | LazyExoticComponent<any>

interface RegistryRoute {
  path:      string
  Component: AnyComponent
  props?:    Record<string, unknown>
}

const _shell:  RegistryRoute[] = []
const _public: RegistryRoute[] = []

export const RouteRegistry = {
  register(path: string, Component: AnyComponent, props?: Record<string, unknown>): void {
    _shell.push({ path, Component, props })
  },
  registerPublic(path: string, Component: AnyComponent, props?: Record<string, unknown>): void {
    _public.push({ path, Component, props })
  },
  getShellRoutes():  readonly RegistryRoute[] { return _shell  },
  getPublicRoutes(): readonly RegistryRoute[] { return _public },
}
