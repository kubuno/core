import { api } from '@kubuno/sdk'
import type { FileItem } from './types'

// Centralised recents: a shared log of "which app opened which file and when"
// (30 max), kept by the drive. Applications RECORD their openings here instead
// of each keeping its own list → recents managed in a single place.

// The full file plus which app opened it and when.
export type RecentFile = FileItem & { module_id: string; opened_at: string }

export const recentApi = {
  /** Records the opening of a file by an app (best-effort, non blocking). */
  record: (fileId: string, moduleId?: string): void => {
    void api.post('/drive/recent', { file_id: fileId, module_id: moduleId }).catch(() => {})
  },
  /** Lists recently opened files (newest first), optionally filtered by app. */
  list: async (opts?: { module?: string; limit?: number }): Promise<RecentFile[]> => {
    const r = await api.get<{ recent: RecentFile[] }>('/drive/recent', { params: opts })
    return r.data.recent
  },
  remove: async (fileId: string): Promise<void> => { await api.delete(`/drive/recent/${fileId}`) },
  clear:  async (): Promise<void> => { await api.delete('/drive/recent') },
}
