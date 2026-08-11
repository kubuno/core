import { api } from '@kubuno/sdk'
import type { FileItem, FileVersion, Folder } from './types'

/** File versioning: history, restore and per-item toggles. */
export const versionApi = {
  listVersions: async (fileId: string): Promise<{ versions: FileVersion[] }> => {
    const r = await api.get<{ versions: FileVersion[] }>(`/drive/${fileId}/versions`)
    return r.data
  },

  createVersion: async (fileId: string, comment?: string): Promise<{ version: FileVersion }> => {
    const r = await api.post<{ version: FileVersion }>(`/drive/${fileId}/versions`, { comment })
    return r.data
  },

  restoreVersion: async (fileId: string, versionId: string): Promise<{ file: FileItem }> => {
    const r = await api.post<{ file: FileItem }>(`/drive/${fileId}/versions/${versionId}/restore`)
    return r.data
  },

  deleteVersion: async (fileId: string, versionId: string): Promise<void> => {
    await api.delete(`/drive/${fileId}/versions/${versionId}`)
  },

  setFileVersioning: async (fileId: string, enabled: boolean): Promise<{ file: FileItem }> => {
    const r = await api.patch<{ file: FileItem }>(`/drive/${fileId}/versioning`, { enabled })
    return r.data
  },

  setFolderVersioning: async (folderId: string, enabled: boolean): Promise<{ folder: Folder }> => {
    const r = await api.patch<{ folder: Folder }>(`/drive/folders/${folderId}/versioning`, { enabled })
    return r.data
  },
}
