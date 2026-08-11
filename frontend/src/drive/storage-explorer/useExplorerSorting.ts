/**
 * Hidden-file / type filtering and sorting of the current listing, plus the flat
 * ordered id list (folders first, then files) that the selection, the keyboard
 * cursor and the progressive window all index into.
 */
import { useMemo } from 'react'
import type { Folder, FileItem } from '../api'
import type { SortField } from './types'

export function useExplorerSorting({ folders, files, sortField, sortDir, typeFilter, showHidden }: {
  folders: Folder[]; files: FileItem[]
  sortField: SortField; sortDir: 'asc' | 'desc'
  typeFilter: string | null; showHidden: boolean
}) {
  const filteredFiles = useMemo(() => {
    let result = files
    if (!showHidden) result = result.filter(f => !f.name.startsWith('.'))
    if (typeFilter) {
      result = result.filter(f => {
        if (typeFilter === 'image') return f.mime_type.startsWith('image/')
        if (typeFilter === 'video') return f.mime_type.startsWith('video/')
        if (typeFilter === 'audio') return f.mime_type.startsWith('audio/')
        if (typeFilter === 'document') return f.mime_type.startsWith('text/') || f.mime_type.includes('pdf') || f.mime_type.includes('word') || f.mime_type.includes('spreadsheet') || f.mime_type.includes('presentation') || f.mime_type.includes('opendocument')
        if (typeFilter === 'archive') return f.mime_type.includes('zip') || f.mime_type.includes('tar') || f.mime_type.includes('gzip') || f.mime_type.includes('rar') || f.mime_type.includes('7z') || f.mime_type.includes('bzip')
        return true
      })
    }
    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      else if (sortField === 'size') cmp = a.size_bytes - b.size_bytes
      else if (sortField === 'date') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      else if (sortField === 'created') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      else if (sortField === 'type') cmp = a.mime_type.localeCompare(b.mime_type)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [files, typeFilter, sortField, sortDir, showHidden])

  const sortedFolders = useMemo(() => [...folders].sort((a, b) => {
    // Folders follow the date/created sort when active; size/type fall back to name.
    const cmp = sortField === 'date'
      ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      : sortField === 'created'
      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : a.name.localeCompare(b.name, 'fr')
    return sortDir === 'asc' ? cmp : -cmp
  }), [folders, sortField, sortDir])

  const orderedIds = useMemo(() => [...sortedFolders.map(f => f.id), ...filteredFiles.map(f => f.id)], [sortedFolders, filteredFiles])

  return { filteredFiles, sortedFolders, orderedIds }
}
