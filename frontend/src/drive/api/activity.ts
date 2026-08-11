import { api } from '@kubuno/sdk'
import type { ActivityEntry, ActivityFeedEntry, InfoExtra } from './types'

/** Activity trails and the extra info shown in the details panel. */
export const activityApi = {
  getFileActivity: async (id: string): Promise<{ activities: ActivityEntry[] }> => {
    const r = await api.get<{ activities: ActivityEntry[] }>(`/drive/${id}/activity`)
    return r.data
  },

  getFolderActivity: async (id: string): Promise<{ activities: ActivityEntry[] }> => {
    const r = await api.get<{ activities: ActivityEntry[] }>(`/drive/folders/${id}/activity`)
    return r.data
  },

  /** Account-wide activity (Drive home, "Activity" tab). */
  getUserActivity: async (limit = 50): Promise<ActivityFeedEntry[]> => {
    const r = await api.get<{ activities: ActivityFeedEntry[] }>('/drive/activity', { params: { limit } })
    return r.data.activities
  },

  getFileInfoExtra: async (id: string): Promise<InfoExtra> => {
    const r = await api.get<InfoExtra>(`/drive/${id}/info-extra`)
    return r.data
  },

  getFolderInfoExtra: async (id: string): Promise<InfoExtra> => {
    const r = await api.get<InfoExtra>(`/drive/folders/${id}/info-extra`)
    return r.data
  },
}
