import { api } from '@kubuno/sdk'
import type { ArchiveEntry, FileItem } from './types'

/** Zip archives: create, browse, extract and download. */
export const archiveApi = {
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
}
