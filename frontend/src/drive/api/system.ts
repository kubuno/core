import { api } from '@kubuno/sdk'
import type { FileItem, Folder, FolderAncestor } from './types'

// SYSTEM directory API (shared; readable by everyone, writable by admins).
// Fixed root = the "System" folder created by the drive migration (system owner).
export const SYSTEM_ROOT_ID = '00000000-0000-0000-0000-0000000005a1'

export const systemApi = {
  listFolders: async (parentId?: string | null): Promise<{ folders: Folder[] }> => {
    const r = await api.get<{ folders: Folder[] }>('/drive/system/folders', { params: parentId ? { parent_id: parentId } : {} })
    return r.data
  },
  listFiles: async (folderId?: string | null): Promise<{ files: FileItem[] }> => {
    const r = await api.get<{ files: FileItem[] }>('/drive/system/files', { params: folderId ? { folder_id: folderId } : {} })
    return r.data
  },
  getFolder: async (id: string): Promise<{ folder: Folder; ancestors: FolderAncestor[] }> => {
    const r = await api.get<{ folder: Folder; ancestors: FolderAncestor[] }>(`/drive/system/folders/${id}`)
    return r.data
  },
  createFolder: async (name: string, parentId: string | null = null): Promise<{ folder: Folder }> => {
    const r = await api.post<{ folder: Folder }>('/drive/system/folders', { name, parent_id: parentId })
    return r.data
  },
  uploadFile: async (file: File, folderId: string | null | undefined, onProgress?: (pct: number) => void, overwrite = false): Promise<{ file: FileItem }> => {
    const fd = new FormData(); fd.append('file', file)
    if (folderId) fd.append('folder_id', folderId)
    if (overwrite) fd.append('overwrite', 'true')
    const r = await api.post<{ file: FileItem }>('/drive/system/upload', fd, {
      onUploadProgress: e => { if (onProgress && e.total) onProgress(Math.round(e.loaded / e.total * 100)) },
    })
    return r.data
  },
  deleteFolder: async (id: string): Promise<void> => { await api.delete(`/drive/system/folders/${id}`) },
  deleteFile:   async (id: string): Promise<void> => { await api.delete(`/drive/system/files/${id}`) },
  downloadUrl: (id: string) => `/api/v1/drive/system/files/${id}/download`,
  downloadBlob: async (id: string): Promise<Blob> => { const r = await api.get(`/drive/system/files/${id}/download`, { responseType: 'blob' }); return r.data as Blob },
}
