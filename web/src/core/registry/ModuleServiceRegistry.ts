// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceFn = (...args: any[]) => any

interface ServiceMap {
  [key: string]: ServiceFn
}

const registry = new Map<string, ServiceMap>()

export const ModuleServiceRegistry = {
  // Appelé par chaque module dans son register.ts
  publish(moduleId: string, api: ServiceMap): void {
    const existing = registry.get(moduleId) ?? {}
    registry.set(moduleId, { ...existing, ...api })
  },

  // Récupère une fonction publiée par un module (pour l'appeler avec ses propres args)
  get<T extends ServiceFn>(moduleId: string, key: string): T | undefined {
    return registry.get(moduleId)?.[key] as T | undefined
  },

  // Appel direct d'une méthode publiée (retourne undefined si le module n'est pas chargé)
  call<T = unknown>(moduleId: string, method: string, ...args: unknown[]): T | undefined {
    const fn = registry.get(moduleId)?.[method]
    return typeof fn === 'function' ? (fn(...args) as T) : undefined
  },
}
