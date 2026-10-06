/**
 * Opening a file, aiming for the experience closest to the local drive:
 * 1) the module handler, 2) the built-in viewer (image/video/audio/pdf/text),
 * 3) « ouvrir avec » the associated editor (materialising remote files first),
 * 4) download as a last resort.
 */
import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { FileTypeRegistry } from '@kubuno/sdk'
import { recentApi, type FileItem } from '../api'
import type { StorageSource } from '../storageSource'
import { isTextFile } from '../FilesTextViewer'

export function useFileOpen({ src, caps, navigate, onOpenFile }: {
  src: StorageSource
  caps: StorageSource['capabilities']
  navigate: NavigateFunction
  onOpenFile?: (file: FileItem) => boolean | void
}) {
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null)
  const [textFile, setTextFile] = useState<FileItem | null>(null)

  // Médias gérés par la visionneuse plein-écran (galerie). Le TEXTE a sa propre
  // fenêtre dédiée (FilesTextViewer), intercepté plus bas dans openFile.
  const isViewable = (f: FileItem) => {
    const m = f.mime_type
    return m.startsWith('image/') || m.startsWith('video/') || m.startsWith('audio/')
      || m === 'application/pdf'
  }
  const openWithRegistry = (file: FileItem): boolean => {
    const openWith = typeof file.metadata?.['open_with'] === 'string' ? file.metadata['open_with'] as string : null
    const pref = openWith ? FileTypeRegistry.get(openWith) : undefined
    if (pref?.open) { recentApi.record(file.id, pref.moduleId); pref.open(file, navigate); return true }
    const opener = FileTypeRegistry.openersFor(file)[0]
    if (opener?.open) { recentApi.record(file.id, opener.moduleId); opener.open(file, navigate); return true }
    return false
  }
  const openFile = async (file: FileItem) => {
    if (onOpenFile && onOpenFile(file)) return
    if (isViewable(file)) { recentApi.record(file.id, 'drive'); setViewerFile(file); return }
    // Préférence explicite « Ouvrir avec » (métadonnée par-fichier) : priorité absolue.
    const hasExplicit = typeof file.metadata?.['open_with'] === 'string'
    if (hasExplicit && caps.openWith && openWithRegistry(file)) return
    // Texte → visionneuse rapide par défaut (un éditeur reste accessible via « Ouvrir avec »).
    if (isTextFile(file)) { recentApi.record(file.id, 'drive'); setTextFile(file); return }
    if (caps.openWith && openWithRegistry(file)) return
    // Distant : un éditeur (.kb*) ne sait ouvrir qu'un fichier local → on
    // matérialise dans Mon Drive puis on ouvre la copie locale.
    if (!caps.openWith && src.materialize && FileTypeRegistry.openersFor(file).length > 0) {
      try {
        const local = await src.materialize(file)
        if (local && openWithRegistry(local)) return
      } catch { /* repli */ }
    }
    src.download({ id: file.id, type: 'file', name: file.name })
  }

  return { viewerFile, setViewerFile, textFile, setTextFile, openFile }
}
