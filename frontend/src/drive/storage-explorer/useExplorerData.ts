/**
 * Data of the current directory, read through the `StorageSource`: root
 * resolution, listing, acceptance filtering (mime types / FileTypeRegistry) and
 * the id → kind map used by the selection and drag code.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileTypeRegistry } from '@kubuno/sdk'
import type { StorageSource } from '../storageSource'

export function useExplorerData({ src, caps, currentFolderId, acceptedMimeTypes, fileTypeModuleId }: {
  src: StorageSource
  caps: StorageSource['capabilities']
  currentFolderId: string | null
  acceptedMimeTypes?: string[]
  fileTypeModuleId?: string
}) {
  const { data: root, isLoading: rootLoading } = useQuery({
    queryKey: ['explorer', src.key, '#root'],
    queryFn: () => src.resolveRoot(),
    staleTime: 30_000,
  })
  const effectiveFolderId = currentFolderId ?? root?.id ?? null
  const rootResolved = root !== undefined && root !== null

  // Stable per-folder key. The virtual root has no id (effectiveFolderId is
  // null there) → « root » so the top level is remembered like any folder.
  const dirKey = `${src.key}:${effectiveFolderId ?? 'root'}`

  const { data, isLoading: listLoading } = useQuery({
    queryKey: ['explorer', src.key, effectiveFolderId],
    queryFn: () => src.list(effectiveFolderId),
    enabled: rootResolved,
    staleTime: 0,
    refetchInterval: caps.thumbnails === 'url' ? 3_000 : false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })
  const isLoading = rootLoading || listLoading
  const folders = data?.folders ?? []
  const rawFiles = data?.files ?? []

  const files = useMemo(() => {
    if (fileTypeModuleId && FileTypeRegistry.get(fileTypeModuleId)) {
      return rawFiles.filter(FileTypeRegistry.matcher(fileTypeModuleId))
    }
    if (!acceptedMimeTypes || acceptedMimeTypes.length === 0) return rawFiles
    return rawFiles.filter(f => acceptedMimeTypes.some(m => f.mime_type === m || f.mime_type.startsWith(m)))
  }, [rawFiles, acceptedMimeTypes, fileTypeModuleId])

  const itemTypeMap = useMemo(() => {
    const map = new Map<string, 'file' | 'folder'>()
    folders.forEach(f => map.set(f.id, 'folder'))
    files.forEach(f => map.set(f.id, 'file'))
    return map
  }, [folders, files])

  return { rootLoading, rootResolved, effectiveFolderId, dirKey, isLoading, folders, files, itemTypeMap }
}
