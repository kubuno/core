import { api } from '@kubuno/sdk'
import type { Folder, FolderAncestor, FolderSize } from './types'

/** Folder tree: listing, CRUD, trash, star and colour. */
export const folderApi = {
  listFolders: async (parentId?: string | null, trashed?: boolean): Promise<{ folders: Folder[] }> => {
    const r = await api.get<{ folders: Folder[] }>('/drive/folders', {
      params: {
        ...(parentId ? { parent_id: parentId } : {}),
        ...(trashed  ? { trashed: true }        : {}),
      },
    })
    return r.data
  },

  trashFolder: async (id: string): Promise<{ folder: Folder }> => {
    const r = await api.post<{ folder: Folder }>(`/drive/folders/${id}/trash`)
    return r.data
  },

  restoreFolder: async (id: string): Promise<{ folder: Folder }> => {
    const r = await api.post<{ folder: Folder }>(`/drive/folders/${id}/restore`)
    return r.data
  },

  getFolder: async (id: string): Promise<{ folder: Folder; ancestors: FolderAncestor[] }> => {
    const r = await api.get<{ folder: Folder; ancestors: FolderAncestor[] }>(`/drive/folders/${id}`)
    return r.data
  },

  createFolder: async (name: string, parentId: string | null = null): Promise<{ folder: Folder }> => {
    const r = await api.post<{ folder: Folder }>('/drive/folders', { name, parent_id: parentId })
    return r.data
  },

  renameFolder: async (id: string, name: string, overwrite = false, strict = false): Promise<{ folder: Folder }> => {
    const r = await api.patch<{ folder: Folder }>(`/drive/folders/${id}/rename`, { name, overwrite, strict })
    return r.data
  },

  moveFolder: async (id: string, parentId: string | null, overwrite = false, strict = false): Promise<{ folder: Folder }> => {
    const r = await api.patch<{ folder: Folder }>(`/drive/folders/${id}/move`, { parent_id: parentId, overwrite, strict })
    return r.data
  },

  deleteFolder: async (id: string): Promise<void> => {
    await api.delete(`/drive/folders/${id}`)
  },

  starFolder: async (id: string): Promise<{ folder: Folder }> => {
    const r = await api.post<{ folder: Folder }>(`/drive/folders/${id}/star`)
    return r.data
  },

  setFolderColor: async (id: string, color: string | null): Promise<{ folder: Folder }> => {
    const r = await api.patch<{ folder: Folder }>(`/drive/folders/${id}/color`, { color })
    return r.data
  },

  listFoldersBySize: async (limit = 500): Promise<{ folders: FolderSize[] }> => {
    const r = await api.get<{ folders: FolderSize[] }>('/drive/folders-by-size', {
      params: { limit },
    })
    return r.data
  },
}
