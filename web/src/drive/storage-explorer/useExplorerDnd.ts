/**
 * Drag & drop: OS files dropped on the explorer (import), items dragged between
 * folders (move) and cross-pane drags coming from ANOTHER source, which are
 * delegated to the parent through `onExternalDrop`.
 */
import { useCallback, useRef, useState } from 'react'
import type React from 'react'
import type { Folder, FileItem } from '../api'
import type { StorageSource } from '../storageSource'
import type { ExternalDragItem } from '../StorageExplorer'
import { DND_MIME } from './types'

export function useExplorerDnd({ src, caps, effectiveFolderId, selectedIds, itemTypeMap, folders, files, invalidate, importEntries, importFiles, onExternalDrop }: {
  src: StorageSource
  caps: StorageSource['capabilities']
  effectiveFolderId: string | null
  selectedIds: Set<string>
  itemTypeMap: Map<string, 'file' | 'folder'>
  folders: Folder[]
  files: FileItem[]
  invalidate: () => void
  importEntries: (entries: FileSystemEntry[], targetId: string | null) => Promise<void>
  importFiles: (files: File[], targetId: string | null) => Promise<void>
  onExternalDrop?: (payload: ExternalDragItem, targetParentId: string | null) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [draggingItem, setDraggingItem] = useState<{ type: 'folder' | 'file'; id: string } | null>(null)
  const dragCounter = useRef(0)

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; if (dragCounter.current === 1 && caps.upload && e.dataTransfer.types.includes('Files')) setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragOver(false) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }
  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string | null = effectiveFolderId) => {
    e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setIsDragOver(false); setDragOverFolderId(null)
    // Glisser inter-volets (depuis une AUTRE source) → transfert délégué au parent.
    const raw = e.dataTransfer.getData(DND_MIME)
    if (raw) {
      try {
        const payload = JSON.parse(raw) as ExternalDragItem
        if (payload.sourceKey !== src.key) { onExternalDrop?.(payload, targetFolderId); return }
      } catch { /* charge utile invalide → on ignore */ }
    }
    if (draggingItem && caps.move && targetFolderId !== null) {
      const ids = selectedIds.has(draggingItem.id) ? [...selectedIds] : [draggingItem.id]
      Promise.all(ids.map(id => {
        const kind = itemTypeMap.get(id) ?? draggingItem.type
        if (id === targetFolderId) return Promise.resolve()
        const name = (kind === 'folder' ? folders : files).find(x => x.id === id)?.name ?? ''
        return src.move({ id, type: kind, name }, targetFolderId)
      })).then(invalidate)
      setDraggingItem(null); return
    }
    if (!caps.upload) return
    const entries = Array.from(e.dataTransfer.items).map(it => it.webkitGetAsEntry?.() ?? null).filter((en): en is FileSystemEntry => en !== null)
    if (entries.length > 0) void importEntries(entries, targetFolderId)
    else void importFiles(Array.from(e.dataTransfer.files), targetFolderId)
  }, [effectiveFolderId, draggingItem, selectedIds, itemTypeMap, importEntries, importFiles, invalidate, caps, folders, files, src, onExternalDrop])

  return {
    isDragOver, dragOverFolderId, setDragOverFolderId, setDraggingItem,
    handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
  }
}
