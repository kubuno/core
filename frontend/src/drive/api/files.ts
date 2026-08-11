import { api } from '@kubuno/sdk'
import type { FileItem } from './types'

/** Files: listing, upload, rename/move/copy, trash and metadata. */
export const fileApi = {
  listFiles: async (
    folderId?: string | null,
    starred?: boolean,
    trashed?: boolean,
    recent?: boolean,
    folderPathPrefix?: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<{ files: FileItem[] }> => {
    const r = await api.get<{ files: FileItem[] }>('/drive/', {
      params: {
        ...(folderId          ? { folder_id: folderId }                       : {}),
        ...(starred           ? { starred: true }                             : {}),
        ...(trashed           ? { trashed: true }                             : {}),
        ...(recent            ? { recent: true }                              : {}),
        ...(folderPathPrefix  ? { folder_path_prefix: folderPathPrefix }      : {}),
        ...(opts?.limit  != null ? { limit:  opts.limit }  : {}),
        ...(opts?.offset != null ? { offset: opts.offset } : {}),
      },
    })
    return r.data
  },

  listFilesBySize: async (limit = 500): Promise<{ files: FileItem[] }> => {
    const r = await api.get<{ files: FileItem[] }>('/drive/', {
      params: { sort_by: 'size', trashed: false, limit },
    })
    return r.data
  },

  uploadFile: async (
    file: File,
    folderId: string | null | undefined,
    onProgress?: (pct: number) => void,
    overwrite = false,
  ): Promise<{ file: FileItem }> => {
    const fd = new FormData()
    fd.append('file', file)
    if (folderId) fd.append('folder_id', folderId)
    if (overwrite) fd.append('overwrite', 'true')
    const r = await api.post<{ file: FileItem }>('/drive/upload', fd, {
      onUploadProgress: e => {
        if (onProgress && e.total) onProgress(Math.round(e.loaded / e.total * 100))
      },
    })
    return r.data
  },

  renameFile: async (id: string, name: string, overwrite = false, strict = false): Promise<{ file: FileItem }> => {
    const r = await api.patch<{ file: FileItem }>(`/drive/${id}/rename`, { name, overwrite, strict })
    return r.data
  },

  moveFile: async (id: string, folderId: string | null, overwrite = false, strict = false): Promise<{ file: FileItem }> => {
    const r = await api.patch<{ file: FileItem }>(`/drive/${id}/move`, { folder_id: folderId, overwrite, strict })
    return r.data
  },

  trashFile: async (id: string): Promise<void> => {
    await api.post(`/drive/${id}/trash`)
  },

  restoreFile: async (id: string): Promise<void> => {
    await api.post(`/drive/${id}/restore`)
  },

  deleteFile: async (id: string): Promise<void> => {
    await api.delete(`/drive/${id}`)
  },

  purgeTrash: async (): Promise<{ folders_deleted: number; files_deleted: number }> => {
    const r = await api.post<{ folders_deleted: number; files_deleted: number }>('/drive/trash/purge')
    return r.data
  },

  setOpenWith: async (fileId: string, moduleId: string | null): Promise<{ file: FileItem }> => {
    const r = await api.patch<{ file: FileItem }>(`/drive/${fileId}/open-with`, { module_id: moduleId })
    return r.data
  },

  updateUserMetadata: async (fileId: string, data: {
    title?:       string
    description?: string
    author?:      string
    keywords?:    string[]
  }): Promise<{ file: FileItem }> => {
    const r = await api.patch<{ file: FileItem }>(`/drive/${fileId}/user-metadata`, data)
    return r.data
  },

  starFile: async (id: string): Promise<{ file: FileItem }> => {
    const r = await api.post<{ file: FileItem }>(`/drive/${id}/star`)
    return r.data
  },

  copyFile: async (id: string, folderId: string | null): Promise<{ file: FileItem }> => {
    const r = await api.post<{ file: FileItem }>(`/drive/${id}/copy`, { folder_id: folderId })
    return r.data
  },
}
