import { api } from './client'
import type { ActiveModule } from '../types'

export const modulesApi = {
  list: () =>
    api.get<{ modules: ActiveModule[] }>('/modules'),

  publicConfig: () =>
    api.get<{ config: Record<string, unknown> }>('/config'),
}
