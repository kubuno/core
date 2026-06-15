import { api } from '@kubuno/sdk'
import { i18n } from '@kubuno/sdk'
import type { FilesSearchFilters } from './store'

export interface FolderAncestor {
  id:   string
  name: string
}

export interface Folder {
  id: string
  name: string
  parent_id: string | null
  path: string
  is_starred: boolean
  is_protected: boolean
  is_trashed: boolean
  trashed_at: string | null
  versioning_enabled: boolean
  color: string | null
  icon: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface FileItem {
  id: string
  name: string
  folder_id: string | null
  size_bytes: number
  mime_type: string
  is_starred: boolean
  is_trashed: boolean
  has_thumbnail: boolean
  versioning_enabled: boolean
  metadata: Record<string, unknown>
  owner_id: string
  created_at: string
  updated_at: string
}

/** Résultat de recherche : un fichier enrichi d'un extrait et d'un score. */
export interface SearchHit extends FileItem {
  snippet:     string | null
  score:       number
  match_kind:  'text' | 'name' | 'semantic'
  folder_path: string | null
}

export interface FileVersion {
  id: string
  file_id: string
  owner_id: string
  version_number: number
  storage_path: string
  size_bytes: number
  content_hash: string | null
  comment: string | null
  created_at: string
}

export interface Share {
  id: string
  owner_id: string
  file_id: string | null
  folder_id: string | null
  token: string | null
  recipient_id: string | null
  can_download: boolean
  can_upload: boolean
  can_delete: boolean
  expires_at: string | null
  download_count: number
  max_downloads: number | null
  created_at: string
  updated_at: string
  revoked_at: string | null
}

export interface CreateShareOptions {
  file_id?: string
  folder_id?: string
  recipient_id?: string
  can_download?: boolean
  can_upload?: boolean
  can_delete?: boolean
  expires_at?: string | null
  max_downloads?: number | null
}

export interface Recipient {
  id:           string
  display_name: string | null
  email:        string
  avatar_url:   string | null
}

export interface FolderSize {
  id:         string
  name:       string
  path:       string
  total_size: number
  file_count: number
}

export interface ActivityEntry {
  id:           number
  user_id:      string
  user_display: string
  action:       string
  details:      Record<string, unknown>
  created_at:   string
}

export interface OwnerInfo {
  id:           string
  display_name: string | null
  email:        string
  avatar_url:   string | null
}

export interface AccessEntry {
  share_id:     string
  recipient_id: string
  display_name: string | null
  email:        string
  avatar_url:   string | null
  can_download: boolean
  can_upload:   boolean
  can_delete:   boolean
  expires_at:   string | null
  created_at:   string
}

export interface InfoExtra {
  owner:  OwnerInfo | null
  access: AccessEntry[]
}

export interface RemoteConnection {
  id:                  string
  name:                string
  provider:            string
  mount_name:          string
  status:              'connected' | 'disconnected' | 'error' | 'syncing'
  last_connected_at:   string | null
  last_error:          string | null
  remote_quota_bytes:  number | null
  remote_used_bytes:   number | null
  created_at:          string
}

export interface CreateRemoteDto {
  name:     string
  provider: string
  config:   Record<string, unknown>
}

/** Une entrée (dossier/fichier) listée en direct dans un montage distant. */
export interface RemoteEntry {
  name:       string
  path:       string
  is_dir:     boolean
  size_bytes: number
}

export interface TestRemoteResult {
  ok:     boolean
  error?: string
  quota?: { total_bytes: number | null; used_bytes: number | null; free_bytes: number | null }
}

export interface ArchiveEntry {
  name:             string
  path:             string
  is_dir:           boolean
  size:             number
  compressed_size:  number
}

export const filesApi = {
  // ── Dossiers ──────────────────────────────────────────────────────────
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

  // ── Fichiers ──────────────────────────────────────────────────────────
  listFiles: async (
    folderId?: string | null,
    starred?: boolean,
    trashed?: boolean,
    recent?: boolean,
    folderPathPrefix?: string,
  ): Promise<{ files: FileItem[] }> => {
    const r = await api.get<{ files: FileItem[] }>('/drive/', {
      params: {
        ...(folderId          ? { folder_id: folderId }                       : {}),
        ...(starred           ? { starred: true }                             : {}),
        ...(trashed           ? { trashed: true }                             : {}),
        ...(recent            ? { recent: true }                              : {}),
        ...(folderPathPrefix  ? { folder_path_prefix: folderPathPrefix }      : {}),
      },
    })
    return r.data
  },

  searchFiles: async (
    q: string,
    filters: FilesSearchFilters,
    opts?: { limit?: number; offset?: number },
  ): Promise<{ results: SearchHit[]; total: number; semantic: boolean }> => {
    const r = await api.get<{ results: SearchHit[]; total: number; semantic: boolean }>('/drive/search', {
      params: {
        q,
        type:           filters.type,
        owner:          filters.owner,
        date:           filters.modifiedDate,
        trash:          filters.inTrash,
        starred:        filters.isStarred,
        item_name:      filters.itemName,
        contains_words: filters.containsWords,
        limit:          opts?.limit ?? 20,
        offset:         opts?.offset ?? 0,
      },
    })
    return r.data
  },

  // Recherche d'images similaires (empreinte perceptuelle) à partir d'une image fournie.
  searchSimilar: async (image: File): Promise<{ results: SearchHit[]; total: number; semantic: boolean }> => {
    const fd = new FormData()
    fd.append('image', image)
    const r = await api.post<{ results: SearchHit[]; total: number; semantic: boolean }>('/drive/search/similar', fd)
    return r.data
  },

  listFilesBySize: async (limit = 500): Promise<{ files: FileItem[] }> => {
    const r = await api.get<{ files: FileItem[] }>('/drive/', {
      params: { sort_by: 'size', trashed: false, limit },
    })
    return r.data
  },

  listFoldersBySize: async (limit = 500): Promise<{ folders: FolderSize[] }> => {
    const r = await api.get<{ folders: FolderSize[] }>('/drive/folders-by-size', {
      params: { limit },
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

  // ── Archives ──────────────────────────────────────────────────────────
  compressSave: async (fileIds: string[], folderIds: string[], archiveName?: string, folderId?: string | null): Promise<{ file: FileItem }> => {
    const r = await api.post<{ file: FileItem }>('/drive/archive/compress-save', {
      file_ids:     fileIds,
      folder_ids:   folderIds,
      archive_name: archiveName ?? 'archive.zip',
      folder_id:    folderId ?? null,
    })
    return r.data
  },

  decompress: async (fileId: string, folderId?: string | null, createSubfolder = true): Promise<{ extracted: number; folder_id: string | null }> => {
    const r = await api.post<{ extracted: number; folder_id: string | null }>(`/drive/${fileId}/decompress`, {
      folder_id:        folderId ?? null,
      create_subfolder: createSubfolder,
    })
    return r.data
  },

  listArchive: async (fileId: string, path = ''): Promise<{ entries: ArchiveEntry[]; path: string; total: number }> => {
    const r = await api.get<{ entries: ArchiveEntry[]; path: string; total: number }>(`/drive/${fileId}/archive/list`, {
      params: path ? { path } : {},
    })
    return r.data
  },

  archiveFileUrl: (fileId: string, path: string) =>
    `/api/v1/drive/${fileId}/archive/file?path=${encodeURIComponent(path)}`,

  compressDownload: async (fileIds: string[], folderIds: string[], archiveName?: string): Promise<void> => {
    const r = await api.post('/drive/compress', {
      file_ids: fileIds,
      folder_ids: folderIds,
      archive_name: archiveName ?? 'archive.zip',
    }, { responseType: 'blob' })
    const blob = new Blob([r.data as BlobPart], { type: 'application/zip' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = archiveName ?? 'archive.zip'
    a.click()
    URL.revokeObjectURL(url)
  },

  // ── Partages ──────────────────────────────────────────────────────────
  listShares: async (): Promise<{ shares: Share[] }> => {
    const r = await api.get<{ shares: Share[] }>('/drive/shares')
    return r.data
  },

  createShare: async (opts: CreateShareOptions): Promise<{ share: Share }> => {
    const r = await api.post<{ share: Share }>('/drive/shares', opts)
    return r.data
  },

  searchRecipients: async (q: string, limit = 10): Promise<Recipient[]> => {
    const r = await api.get<{ recipients: Recipient[] }>('/drive/shares/recipients', {
      params: { q, limit },
    })
    return r.data.recipients ?? []
  },

  revokeShare: async (id: string): Promise<void> => {
    await api.delete(`/drive/shares/${id}`)
  },

  thumbnailUrl: (id: string) => `/api/v1/drive/${id}/thumbnail`,
  downloadUrl:  (id: string) => `/api/v1/drive/${id}/download`,
  downloadBlob: async (id: string): Promise<Blob> => {
    const r = await api.get(`/drive/${id}/download`, { responseType: 'blob' })
    return r.data as Blob
  },

  // ── Versionnage ───────────────────────────────────────────────────────
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

  // ── Activité & infos extra ────────────────────────────────────────────
  getFileActivity: async (id: string): Promise<{ activities: ActivityEntry[] }> => {
    const r = await api.get<{ activities: ActivityEntry[] }>(`/drive/${id}/activity`)
    return r.data
  },

  getFolderActivity: async (id: string): Promise<{ activities: ActivityEntry[] }> => {
    const r = await api.get<{ activities: ActivityEntry[] }>(`/drive/folders/${id}/activity`)
    return r.data
  },

  getFileInfoExtra: async (id: string): Promise<InfoExtra> => {
    const r = await api.get<InfoExtra>(`/drive/${id}/info-extra`)
    return r.data
  },

  getFolderInfoExtra: async (id: string): Promise<InfoExtra> => {
    const r = await api.get<InfoExtra>(`/drive/folders/${id}/info-extra`)
    return r.data
  },

  revokeAccess: async (shareId: string): Promise<void> => {
    await api.delete(`/drive/shares/${shareId}`)
  },

  // ── Remote connections ───────────────────────────────────────────────────────
  listRemotes: async (): Promise<RemoteConnection[]> => {
    const r = await api.get<{ connections: RemoteConnection[] }>('/drive/remotes')
    return r.data.connections ?? []
  },

  createRemote: async (dto: CreateRemoteDto): Promise<{ id: string; mount_name: string }> => {
    const r = await api.post('/drive/remotes', dto)
    return r.data
  },

  deleteRemote: async (id: string): Promise<void> => {
    await api.delete(`/drive/remotes/${id}`)
  },

  testRemote: async (id: string): Promise<TestRemoteResult> => {
    const r = await api.post<TestRemoteResult>(`/drive/remotes/${id}/test`)
    return r.data
  },

  // Navigation LIVE dans un montage distant (pas indexé dans l'arbre local).
  // Chemin SANS slash de tête ; la racine ('') passe par la route dédiée /browse
  // (la route catch-all *path ne matche pas une chaîne vide).
  browseRemote: async (id: string, path: string): Promise<RemoteEntry[]> => {
    const p = path.replace(/^\/+/, '').replace(/\/+$/, '')
    const url = p
      ? `/drive/remotes/${id}/browse/${p.split('/').map(encodeURIComponent).join('/')}`
      : `/drive/remotes/${id}/browse`
    const r = await api.get<{ items: RemoteEntry[] }>(url)
    return r.data.items ?? []
  },

  deleteRemoteEntry: async (id: string, path: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    await api.delete(`/drive/remotes/${id}/entry/${p.split('/').map(encodeURIComponent).join('/')}`)
  },

  renameRemoteEntry: async (id: string, path: string, to: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    await api.post(`/drive/remotes/${id}/rename/${p.split('/').map(encodeURIComponent).join('/')}`, { to })
  },

  // Crée un dossier sur un montage distant (mkdir).
  createRemoteDir: async (id: string, path: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    await api.post(`/drive/remotes/${id}/mkdir/${p.split('/').map(encodeURIComponent).join('/')}`, {})
  },

  // Écrit un fichier sur un montage distant (path = dossier distant + nom).
  uploadRemoteFile: async (id: string, path: string, data: Blob | File): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    const url = `/drive/remotes/${id}/upload/${p.split('/').map(encodeURIComponent).join('/')}`
    await api.post(url, data, { headers: { 'Content-Type': 'application/octet-stream' } })
  },

  // Récupère le contenu d'un fichier distant en mémoire (pour matérialisation /
  // ouverture dans un éditeur sans déclencher un téléchargement navigateur).
  fetchRemoteFileBlob: async (id: string, path: string): Promise<Blob> => {
    const p = path.replace(/^\/+/, '')
    const url = `/drive/remotes/${id}/file/${p.split('/').map(encodeURIComponent).join('/')}`
    const r = await api.get(url, { responseType: 'blob' })
    return r.data as Blob
  },

  downloadRemoteFile: async (id: string, path: string, fileName: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    const reqUrl = `/drive/remotes/${id}/file/${p.split('/').map(encodeURIComponent).join('/')}`
    const r = await api.get(reqUrl, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([r.data as BlobPart]))
    const a = document.createElement('a')
    a.href = blobUrl; a.download = fileName; a.click()
    URL.revokeObjectURL(blobUrl)
  },
}

export function formatSize(bytes: number): string {
  const u = (k: string) => i18n.t(`drive:common.${k}`)
  if (bytes < 1024) return `${bytes} ${u('byte')}`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} ${u('kb')}`
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} ${u('mb')}`
  return `${(bytes / 1_073_741_824).toFixed(2)} ${u('gb')}`
}

// ── API du répertoire SYSTÈME (partagé ; lecture pour tous, écriture admins) ─────
// Racine fixe = dossier « System » créé par la migration drive (owner système).
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
