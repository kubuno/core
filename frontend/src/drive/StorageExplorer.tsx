/**
 * StorageExplorer — LA zone d'exploration de fichiers, générique et partagée par
 * TOUS les types de stockage (local + montages distants). Pilotée par une
 * `StorageSource` ; chaque source déclare ses capacités → on masque les fonctions
 * non supportées. Calqué visuellement sur « Mon Drive » (barre de sélection, tri/
 * type/affichage, dossiers/fichiers, multi-sélection, marquee, glisser-déposer,
 * menu contextuel). Cf. [[project_storage_explorer_generalized]].
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Folder as FolderIcon, Upload, ChevronRight, ChevronLeft, ChevronDown, Loader2, Home,
  Star, Trash2, Pencil, Share2, Download, MoreVertical, CloudUpload, Info,
  Image, History, FolderPlus, RefreshCw, Scissors, Copy, ClipboardPaste,
  Archive, Link, X, ListChecks, CheckSquare,
} from 'lucide-react'
import { filesApi, formatSize, type Folder, type FileItem } from './api'
import { useFilesStore } from './store'
import { useFilesPaintStore } from './filesPaintStore'
import { useAuthStore, api, prompt, useConfirm, type User } from '@kubuno/sdk'
import { ViewMenu, VIEW_SPECS, type ViewMode } from './fileView'
import NewFolderModal from './NewFolderModal'
import BatchRenameModal, { type BatchRenameItem } from './BatchRenameModal'
import { useBatchRenameStore } from './batchRenameStore'
import MoveModal from './MoveModal'
import ShareModal, { type ShareTarget } from './ShareModal'
import FileInfoModal, { type InfoTarget } from './FileInfoModal'
import VersionHistoryModal from './VersionHistoryModal'
import UploadPanel from './UploadPanel'
import { FloatCheckbox, Button, Dropdown, MenuDropdown, ConfirmDialog, type MenuItem, type ConflictChoice, ConflictDialog } from '@ui'
import { useImageCacheStore, bumpAllImageCache, FileTypeRegistry, usePendingDeletionStore, usePendingKind, pendingBoxClass, pendingBoxStyle, type DeletionKind, type PendingItem } from '@kubuno/sdk'
import { getFileIcon, OpenWithSubmenu, OrganiserSubmenu } from './filesShared'
import { useFilesMediaPlayerStore } from './filesMediaPlayerStore'
import { useFilesVideoPlayerStore } from './filesVideoPlayerStore'
import { useMarqueeSelection } from './useMarqueeSelection'
import { localSource, type StorageSource, type ItemRef, type ThumbSpec } from './storageSource'
import { FolderGlyph } from './FolderGlyph'
import FilesTextViewer, { isTextFile } from './FilesTextViewer'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FileContextAction {
  id:       string
  label:    string
  icon?:    React.ComponentType<{ size?: number; className?: string }>
  danger?:  boolean
  visible?: (file: FileItem) => boolean
  onClick:  (file: FileItem) => void
}

export interface StorageExplorerProps {
  /** Source de stockage. Par défaut = stockage local (`folderPathPrefix`). */
  source?:             StorageSource
  /** Préfixe racine pour la source locale par défaut (ex. "Office/Documents"). */
  folderPathPrefix?:   string
  title:               string
  onOpenFile?:         (file: FileItem) => boolean | void
  fileContextActions?: FileContextAction[]
  toolbarContent?:     React.ReactNode
  hideImport?:         boolean
  importMenuItems?:    MenuItem[]
  renderFileCard?:     (file: FileItem, defaultCard: React.ReactNode) => React.ReactNode
  emptyState?:         React.ReactNode
  acceptedMimeTypes?:  string[]
  fileTypeModuleId?:   string
  /** Dépôt d'un élément provenant d'une AUTRE source (vue double-volet). */
  onExternalDrop?:     (payload: ExternalDragItem, targetParentId: string | null) => void
  /** Synchronise la navigation avec un paramètre d'URL (ex. "path" pour le
   *  distant, "folder" pour le local). Le fil d'Ariane est reconstruit via
   *  `source.resolveAncestors`, donc valable pour des ids chemin OU UUID. */
  pathParam?:          string
  /** Expose les déclencheurs d'actions (Importer fichiers/dossier, Nouveau
   *  dossier) pour qu'un parent (ex. le bouton « Nouveau » de la sidebar) les
   *  pilote dans le dossier courant de CE composant. Appelé au montage. */
  onRegisterActions?:  (a: { importFiles: () => void; importFolder: () => void; newFolder: () => void }) => void
}

/** Charge utile d'un glisser inter-volets (sérialisée dans le dataTransfer). */
export interface ExternalDragItem { sourceKey: string; id: string; type: 'file' | 'folder'; name: string }
const DND_MIME = 'application/x-kubuno-item'

type MenuTarget =
  | { type: 'folder'; item: Folder;   x: number; y: number }
  | { type: 'file';   item: FileItem; x: number; y: number }
  | null

// ── Helpers ────────────────────────────────────────────────────────────────────

async function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = []
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej))
    if (batch.length === 0) break
    all.push(...batch)
  }
  return all
}

// Miniature pilotée par la source : URL directe (local), blob chargé à la demande
// (distant), ou icône par type.
function Thumb({ spec, file, className }: { spec: ThumbSpec; file: FileItem; className?: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    if (spec.kind !== 'blob' || !spec.load || err) return
    let alive = true; let url: string | null = null
    spec.load().then(b => { if (!alive || !b) return; url = URL.createObjectURL(b); setBlobUrl(url) }).catch(() => { if (alive) setErr(true) })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [spec, err])

  const thumbVer = useImageCacheStore(s => s.global + (s.versions[file.id] ?? 0))
  if (spec.kind === 'url' && spec.url && !err) {
    const src = thumbVer ? `${spec.url}?v=${thumbVer}` : spec.url
    return <img src={src} alt={file.name} className={className} loading="lazy" onError={() => setErr(true)} />
  }
  if (spec.kind === 'blob' && blobUrl && !err) {
    return <img src={blobUrl} alt={file.name} className={className} onError={() => setErr(true)} />
  }
  return <span className="scale-75">{getFileIcon(file.mime_type, file.name)}</span>
}

// ── Menu contextuel (items, gating par capacités) ───────────────────────────────
// Construit la liste d'items pour <MenuDropdown>. Les sous-menus dynamiques
// (« Ouvrir avec » + grille couleurs de l'« Organiser ») sont embarqués via des
// items `custom` qui rendent leurs composants existants tels quels.

interface ItemMenuHandlers {
  caps: StorageSource['capabilities']
  onClose: () => void
  onRename: () => void
  onMove: () => void
  onStar: () => void
  onTrash: () => void
  onDelete: () => void
  onShare: () => void
  onGetLink: () => void
  onInfo: () => void
  onEditPaint: () => void
  onVersionHistory: () => void
  onDownload: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onCompress: () => void
  onSetColor: (color: string | null) => void
  clipboard: { action: 'cut' | 'copy'; type: 'file' | 'folder'; id: string; name: string } | null
  fileContextActions?: FileContextAction[]
  isPlaying?: boolean
}

function buildItemMenuItems(
  menu: NonNullable<MenuTarget>,
  tr: (k: string) => string,
  h: ItemMenuHandlers,
): MenuItem[] {
  const { caps, clipboard, fileContextActions, isPlaying = false } = h
  const isFile = menu.type === 'file'
  const isFolder = menu.type === 'folder'
  const starred = isFile ? (menu.item as FileItem).is_starred : (menu.item as Folder).is_starred
  const folderColor = isFolder ? (menu.item as Folder).color : null
  const isProtected = isFolder && !!(menu.item as Folder).is_protected
  const trashDisabled = isProtected || isPlaying

  const items: MenuItem[] = []

  // Actions contextuelles fournies par le parent (fichiers uniquement).
  if (isFile && fileContextActions && fileContextActions.length > 0) {
    fileContextActions
      .filter(a => (a.visible ? a.visible(menu.item as FileItem) : true))
      .forEach(action => {
        const Icon = action.icon
        items.push({
          type: 'action',
          label: action.label,
          danger: action.danger,
          icon: Icon ? <Icon size={14} /> : undefined,
          onClick: () => action.onClick(menu.item as FileItem),
        })
      })
    items.push({ type: 'separator' })
  }

  items.push({ type: 'action', label: isFolder ? tr('ctx.download_zip') : tr('common.download'), icon: <Download size={14} />, onClick: h.onDownload })
  if (caps.rename) items.push({ type: 'action', label: tr('common.rename'), shortcut: 'F2', icon: <Pencil size={14} />, onClick: h.onRename, disabled: isProtected })
  if (isFile && caps.openWith) items.push({ type: 'custom', render: (close) => <OpenWithSubmenu file={menu.item as FileItem} onClose={close} /> })
  if (isFile && caps.openWith && (menu.item as FileItem).mime_type.startsWith('image/'))
    items.push({ type: 'action', label: tr('ctx.edit_paint'), icon: <Image size={14} />, onClick: h.onEditPaint })

  if (caps.share || caps.getLink || caps.richModals) items.push({ type: 'separator' })
  if (caps.share) items.push({ type: 'action', label: tr('ctx.share'), icon: <Share2 size={14} />, onClick: h.onShare })
  if (caps.getLink) items.push({ type: 'action', label: tr('ctx.get_link'), icon: <Link size={14} />, onClick: h.onGetLink })
  if (caps.richModals)
    items.push({
      type: 'custom',
      render: (close) => (
        <OrganiserSubmenu isFolder={isFolder} starred={starred} folderColor={folderColor} isProtected={isProtected}
          onMove={h.onMove} onStar={h.onStar} onSetColor={h.onSetColor} onClose={close} />
      ),
    })

  if (caps.move || caps.copy || caps.compress) items.push({ type: 'separator' })
  if (caps.move) items.push({ type: 'action', label: tr('ctx.cut'), icon: <Scissors size={14} />, onClick: h.onCut, disabled: isProtected })
  if (caps.copy) items.push({ type: 'action', label: tr('ctx.copy'), icon: <Copy size={14} />, onClick: h.onCopy })
  if (isFolder && clipboard && (caps.move || caps.copy)) items.push({ type: 'action', label: tr('ctx.paste'), icon: <ClipboardPaste size={14} />, onClick: h.onPaste })
  if (isFile && caps.compress) items.push({ type: 'action', label: tr('ctx.compress'), icon: <Archive size={14} />, onClick: h.onCompress })

  if (caps.info || (isFile && caps.versions)) items.push({ type: 'separator' })
  if (caps.info) items.push({ type: 'action', label: isFolder ? tr('ctx.info_folder') : tr('ctx.info_file'), icon: <Info size={14} />, onClick: h.onInfo })
  if (isFile && caps.versions) items.push({ type: 'action', label: tr('version.title'), icon: <History size={14} />, onClick: h.onVersionHistory })

  if (caps.delete) {
    items.push({ type: 'separator' })
    items.push({
      type: 'action',
      label: caps.trash ? (isFile ? tr('ctx.trash') : tr('ctx.trash_folder')) : tr('common.delete'),
      icon: <Trash2 size={14} />,
      danger: true,
      disabled: trashDisabled,
      // caps.trash → onTrash (file) / onDelete (folder) ; sinon onDelete.
      onClick: () => (caps.trash && isFile ? h.onTrash : h.onDelete)(),
    })
  }

  return items
}

// ── FolderCard ─────────────────────────────────────────────────────────────────

function FolderCard({ folder, isDragTarget, selected, preSelected, canMove, onSelect, onToggle, onOpen, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop }: {
  folder: Folder; isDragTarget: boolean; selected: boolean; preSelected?: boolean; canMove: boolean
  onSelect: (id: string, e: React.MouseEvent) => void; onToggle: (id: string) => void; onOpen: () => void
  onContextMenu: (e: React.MouseEvent) => void; onDragStart: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void; onDrop: (e: React.DragEvent) => void
}) {
  const pendingKind = usePendingKind(folder.id)
  return (
    <div data-selectable-id={folder.id}
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-default select-none min-w-0
        ${isDragTarget ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
          : selected ? 'border-primary ring-2 ring-primary/20 bg-[#c9defa]'
          : preSelected ? 'border-primary/50 bg-[#c9defa]'
          : 'border-[#e8eaed] bg-[#f3f4f5] hover:border-border hover:bg-[#e4ecf7] hover:shadow-sm'} ${pendingBoxClass(pendingKind)}`}
      style={pendingBoxStyle(pendingKind)} draggable={canMove}
      onClick={(e) => { e.preventDefault(); onSelect(folder.id, e) }}
      onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen() }}
      onContextMenu={onContextMenu} onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <FloatCheckbox selected={selected} onToggle={() => onToggle(folder.id)} className="absolute -top-1.5 -left-1.5 z-10" />
      <FolderGlyph folder={folder} size={20} className="shrink-0" />
      <span className="text-sm text-text-primary truncate flex-1">{folder.name}</span>
      {folder.is_starred && <Star size={12} className="shrink-0 fill-yellow-400 text-yellow-400" />}
      <button className="shrink-0 p-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); onContextMenu(e) }}>
        <MoreVertical size={14} className="text-text-secondary" />
      </button>
    </div>
  )
}

// ── FileCard (vue icônes) ────────────────────────────────────────────────────────

function FileCard({ file, thumb, selected, preSelected, canMove, allowVideoPreview, onSelect, onToggle, onContextMenu, onDragStart, onOpen, thumbH = 128, iconScale = 1, dense = false }: {
  file: FileItem; thumb: ThumbSpec; selected: boolean; preSelected?: boolean; canMove: boolean; allowVideoPreview: boolean
  onSelect: (id: string, e: React.MouseEvent) => void; onToggle: (id: string) => void
  onContextMenu: (e: React.MouseEvent) => void; onDragStart: (e: React.DragEvent) => void; onOpen: () => void
  thumbH?: number; iconScale?: number; dense?: boolean
}) {
  const pendingKind = usePendingKind(file.id)
  const isImage = file.mime_type.startsWith('image/')
  const isVideo = file.mime_type.startsWith('video/')
  const hasBigThumb = (thumb.kind !== 'none') && (isImage || (isVideo && allowVideoPreview))
  return (
    <div data-selectable-id={file.id}
      className={`group relative rounded-xl border hover:shadow-[0_1px_6px_rgba(0,0,0,0.1)] transition-all min-w-0 select-none cursor-default overflow-hidden
        ${selected ? 'border-primary ring-2 ring-primary/20 bg-[#ddeafc]' : preSelected ? 'border-primary/50 bg-[#ddeafc]' : 'border-[#e8eaed] bg-surface-1 hover:border-border hover:bg-[#e4ecf7]'} ${pendingBoxClass(pendingKind)}`}
      style={pendingBoxStyle(pendingKind)} draggable={canMove}
      onContextMenu={onContextMenu} onDragStart={onDragStart}
      onClick={(e) => { e.preventDefault(); onSelect(file.id, e) }}
      onDoubleClick={(e) => { e.preventDefault(); onOpen() }}>
      <FloatCheckbox selected={selected} onToggle={() => onToggle(file.id)} className="absolute top-2 left-2 z-10" />
      {/* En-tête : icône de type + nom + étoile + menu (la checkbox couvre l'icône au survol) */}
      <div className={`flex items-center gap-2 ${dense ? 'px-2 h-8' : 'px-3 h-10'}`}>
        <span className="shrink-0 flex items-center [&_svg]:w-[18px] [&_svg]:h-[18px]">{getFileIcon(file.mime_type, file.name)}</span>
        <span className={`${dense ? 'text-xs' : 'text-[13px]'} font-medium text-text-primary truncate flex-1`} title={file.name}>{file.name}</span>
        {file.is_starred && <Star size={12} className="shrink-0 fill-yellow-400 text-yellow-400" />}
        <button className="shrink-0 -mr-1.5 p-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); onContextMenu(e) }}>
          <MoreVertical size={14} className="text-text-secondary" />
        </button>
      </div>
      {/* Aperçu : miniature pleine zone, sinon grande icône de type centrée */}
      <div className={`relative overflow-hidden rounded-lg bg-white ${dense ? 'mx-1.5 mb-1.5' : 'mx-2 mb-2'}`} style={{ height: thumbH }}>
        {hasBigThumb ? (
          <Thumb spec={thumb} file={file} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div style={{ transform: `scale(${iconScale})` }}>{getFileIcon(file.mime_type, file.name)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── FileRow (vue liste) ──────────────────────────────────────────────────────────

function FileRow({ file, thumb, onContextMenu, onOpen, density = 'normal', hideMeta = false }: {
  file: FileItem; thumb: ThumbSpec; onContextMenu: (e: React.MouseEvent) => void; onOpen: () => void
  density?: 'compact' | 'normal' | 'large'; hideMeta?: boolean
}) {
  const { i18n } = useTranslation('drive')
  const pendingKind = usePendingKind(file.id)
  const updated = new Date(file.updated_at).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })
  const pad = density === 'compact' ? 'px-3 py-1' : density === 'large' ? 'px-4 py-3.5' : 'px-4 py-2.5'
  const thumbC = density === 'large' ? 'w-12 h-12' : density === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
  return (
    <div className={`group flex items-center gap-3 ${pad} bg-white hover:bg-surface-1 transition-colors cursor-default select-none ${pendingBoxClass(pendingKind)}`}
      style={pendingBoxStyle(pendingKind)} onContextMenu={onContextMenu} onDoubleClick={e => { e.preventDefault(); onOpen() }}>
      <div className={`shrink-0 ${thumbC} flex items-center justify-center rounded overflow-hidden bg-surface-2`}>
        <Thumb spec={thumb} file={file} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{file.name}</p>
        {density === 'large' && <p className="text-[11px] text-text-tertiary truncate">{file.mime_type} · {formatSize(file.size_bytes)}</p>}
      </div>
      {!hideMeta && file.updated_at > '1971' && <span className="text-xs text-text-tertiary shrink-0 w-28 text-right">{updated}</span>}
      {!hideMeta && <span className="text-xs text-text-tertiary shrink-0 w-20 text-right">{formatSize(file.size_bytes)}</span>}
      {file.is_starred && <Star size={13} className="shrink-0 fill-yellow-400 text-yellow-400" />}
      <button className="shrink-0 p-1.5 rounded-full hover:bg-surface-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); onContextMenu(e) }}>
        <MoreVertical size={14} className="text-text-secondary" />
      </button>
    </div>
  )
}

// ── SortFilterBar (dropdown Type, identique à Mon Drive) ─────────────────────────

function SortFilterBar({ sortField, sortDir, typeFilter, onSortField, onSortDir, onTypeFilter, hideType, viewMode, onViewMode, compact, onCompact, showHidden, onShowHidden }: {
  sortField: 'name' | 'size' | 'date' | 'type'; sortDir: 'asc' | 'desc'; typeFilter: string | null
  onSortField: (v: 'name' | 'size' | 'date' | 'type') => void; onSortDir: (v: 'asc' | 'desc') => void
  onTypeFilter: (v: string | null) => void; hideType?: boolean
  viewMode: ViewMode; onViewMode: (v: ViewMode) => void; compact: boolean; onCompact: (v: boolean) => void
  showHidden: boolean; onShowHidden: (v: boolean) => void
}) {
  const { t } = useTranslation('drive')
  const SORT_OPTIONS = [
    { value: 'date', label: t('app.sort_date') }, { value: 'name', label: t('common.name') },
    { value: 'size', label: t('common.size') }, { value: 'type', label: t('filter.type') },
  ]
  const TYPE_OPTIONS = [
    { value: '', label: t('app.ft_all') }, { value: 'image', label: t('app.ft_images') },
    { value: 'video', label: t('filter.t_video') }, { value: 'audio', label: t('filter.t_audio') },
    { value: 'document', label: t('filter.t_document') }, { value: 'archive', label: t('filter.t_archive') },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2 pb-3 -mx-6 px-6 border-b border-border">
      <div className="flex items-center gap-1">
        <span className="text-sm text-text-tertiary select-none font-medium">{t('app.sort_label')}</span>
        <Dropdown variant="ghost" value={sortField} onChange={v => onSortField(v as typeof sortField)} options={SORT_OPTIONS} />
        <button onClick={() => onSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="ml-0.5 text-sm text-text-secondary hover:text-primary transition-colors select-none"
          title={sortDir === 'asc' ? t('app.sort_asc') : t('app.sort_desc')}>{sortDir === 'asc' ? '↑' : '↓'}</button>
      </div>
      {!hideType && <>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1">
          <span className="text-sm text-text-tertiary select-none font-medium">{t('app.type_label')}</span>
          <Dropdown variant="ghost" value={typeFilter ?? ''} onChange={v => onTypeFilter(v === '' ? null : v)} options={TYPE_OPTIONS} />
        </div>
      </>}
      <div className="ml-auto">
        <ViewMenu value={viewMode} onChange={onViewMode} compact={compact} onCompact={onCompact} showHidden={showHidden} onShowHidden={onShowHidden} t={t} />
      </div>
    </div>
  )
}

// ── MediaViewer (visionneuse générique image/vidéo/audio/pdf/texte) ──────────────
// Pour les IMAGES, navigue en galerie parmi les autres images du même dossier
// (flèches à l'écran + touches ←/→). Les autres types s'ouvrent seuls.

function MediaViewer({ files, start, contentOf, onClose }: {
  files: FileItem[]; start: number; contentOf: (f: FileItem) => ThumbSpec; onClose: () => void
}) {
  const [idx, setIdx] = useState(start)
  const file = files[Math.max(0, Math.min(idx, files.length - 1))]
  const [url, setUrl] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  const m = file.mime_type
  const isText = m.startsWith('text/') || m === 'application/json' || /\.(txt|md|csv|log|json|xml|yaml|yml)$/i.test(file.name)
  const canNav = m.startsWith('image/') && files.length > 1
  const go = (d: number) => setIdx(i => (i + d + files.length) % files.length)

  useEffect(() => {
    let alive = true; let obj: string | null = null
    setErr(false); setText(null)
    const spec = contentOf(file)
    setUrl(spec.kind === 'url' ? (spec.url ?? null) : null)
    const txtKind = m.startsWith('text/') || m === 'application/json' || /\.(txt|md|csv|log|json|xml|yaml|yml)$/i.test(file.name)
    async function run() {
      try {
        let blob: Blob | null = null
        if (spec.kind === 'blob' && spec.load) blob = await spec.load()
        if (blob) { obj = URL.createObjectURL(blob); if (alive) setUrl(obj) }
        if (txtKind) {
          const t = blob ? await blob.text() : (spec.url ? await (await fetch(spec.url)).text() : '')
          if (alive) setText(t)
        }
      } catch { if (alive) setErr(true) }
    }
    run()
    return () => { alive = false; if (obj) URL.revokeObjectURL(obj) }
  }, [file.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (canNav && e.key === 'ArrowRight') go(1)
      else if (canNav && e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [canNav, files.length, onClose])

  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-3 text-white/90" onClick={e => e.stopPropagation()}>
        <span className="text-sm font-medium truncate">
          {file.name}{canNav && <span className="ml-2 text-white/50">{idx + 1} / {files.length}</span>}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/15 transition-colors"><X size={20} /></button>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {canNav && (
          <button onClick={() => go(-1)} aria-label="Précédent"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors">
            <ChevronLeft size={26} />
          </button>
        )}
        {err ? (
          <p className="text-white/80 text-sm">Aperçu indisponible.</p>
        ) : isText ? (
          <pre className="max-w-4xl w-full max-h-full overflow-auto bg-white text-text-primary text-sm rounded-lg p-4 whitespace-pre-wrap">{text ?? '…'}</pre>
        ) : !url ? (
          <Loader2 size={28} className="animate-spin text-white/80" />
        ) : m.startsWith('image/') ? (
          <img src={url} alt={file.name} className="max-w-full max-h-full object-contain" />
        ) : m.startsWith('video/') ? (
          <video src={url} controls autoPlay className="max-w-full max-h-full" />
        ) : m.startsWith('audio/') ? (
          <audio src={url} controls autoPlay className="w-[min(600px,90vw)]" />
        ) : m === 'application/pdf' ? (
          <iframe src={url} title={file.name} className="w-full h-full bg-white rounded-lg" />
        ) : (
          <p className="text-white/80 text-sm">Aperçu non disponible — téléchargez le fichier.</p>
        )}
        {canNav && (
          <button onClick={() => go(1)} aria-label="Suivant"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors">
            <ChevronRight size={26} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Fil d'Ariane (style Flowbite) ────────────────────────────────────────────────
// Racine avec icône Maison, séparateurs chevron, segments cliquables (le dernier =
// page courante, non cliquable). Un bouton déroulant en fin de fil permet de sauter
// directement dans un SOUS-DOSSIER du dossier courant.

function StorageBreadcrumb({ rootName, crumbs, onNavigate, childFolders, onOpenChild, ariaLabel }: {
  rootName: string
  crumbs: Array<{ id: string; name: string }>
  onNavigate: (idx: number) => void            // -1 = racine, sinon index du segment
  childFolders: Folder[]
  onOpenChild: (folder: Folder) => void
  ariaLabel?: string
}) {
  const { t } = useTranslation('drive')
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const link = 'inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors'

  return (
    <nav className="flex items-center min-w-0" aria-label={ariaLabel}>
      <ol className="inline-flex items-center gap-1.5 flex-wrap min-w-0">
        <li className="inline-flex items-center">
          <button onClick={() => onNavigate(-1)} className={link} title={rootName}>
            <Home size={16} className="me-1.5 shrink-0" />
            <span className="truncate max-w-[14rem]">{rootName}</span>
          </button>
        </li>
        {crumbs.map((crumb, idx) => {
          const last = idx === crumbs.length - 1
          return (
            <li key={crumb.id} aria-current={last ? 'page' : undefined}>
              <div className="flex items-center gap-1.5">
                <ChevronRight size={14} className="text-text-tertiary shrink-0" />
                {last
                  ? <span className="inline-flex items-center text-sm font-medium text-text-primary truncate max-w-[16rem]">{crumb.name}</span>
                  : <button onClick={() => onNavigate(idx)} className={`${link} truncate max-w-[14rem]`}>{crumb.name}</button>}
              </div>
            </li>
          )
        })}
      </ol>

      {childFolders.length > 0 && (
        <button
          type="button"
          onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: r.left, y: r.bottom + 4 }) }}
          className="ms-2.5 inline-flex items-center text-text-secondary bg-surface-1 border border-border hover:bg-surface-2 hover:text-text-primary shadow-xs font-medium leading-5 rounded-md text-sm px-2.5 py-1.5 transition-colors focus:outline-none"
        >
          <FolderIcon size={14} className="me-1.5 shrink-0" />
          {t('breadcrumb.go_to', { defaultValue: 'Aller à' })}
          <ChevronDown size={14} className="ms-1.5 shrink-0" />
        </button>
      )}
      {menu && (
        <MenuDropdown
          items={childFolders.map(f => ({ type: 'action' as const, label: f.name, icon: <FolderGlyph folder={f} size={15} />, onClick: () => onOpenChild(f) }))}
          pos={{ top: menu.y, left: menu.x }}
          onClose={() => setMenu(null)}
        />
      )}
    </nav>
  )
}

// ── Composant principal ──────────────────────────────────────────────────────────

export default function StorageExplorer({
  source, folderPathPrefix, title, onOpenFile, fileContextActions, toolbarContent,
  hideImport, importMenuItems, renderFileCard, emptyState, acceptedMimeTypes,
  fileTypeModuleId, onExternalDrop, pathParam, onRegisterActions,
}: StorageExplorerProps) {
  const { t } = useTranslation('drive')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()
  const src = useMemo(() => source ?? localSource({ rootPrefix: folderPathPrefix, rootName: title }), [source, folderPathPrefix, title])
  const caps = src.capabilities

  const { addUpload, updateUpload, clipboard, setClipboard, clearClipboard } = useFilesStore()
  const { updateUser } = useAuthStore()
  const { confirmState, handleConfirm, handleCancel } = useConfirm()
  const refreshUser = useCallback(() => { api.get<{ user: User }>('/me').then(res => updateUser(res.data.user)).catch(() => {}) }, [updateUser])

  const playingAudioFileId = useFilesMediaPlayerStore(s => s.file?.id ?? null)
  const playingVideoFileId = useFilesVideoPlayerStore(s => s.file?.id ?? null)
  const playingFileIds = useMemo(() => {
    const s = new Set<string>()
    if (playingAudioFileId) s.add(playingAudioFileId)
    if (playingVideoFileId) s.add(playingVideoFileId)
    return s
  }, [playingAudioFileId, playingVideoFileId])

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([])
  const [viewMode, setViewMode] = useState<ViewMode>('lg')
  const [compact, setCompact] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastSelectedIdxRef = useRef<number>(-1)

  const handleMarqueeSelect = useCallback((ids: Set<string>, additive: boolean) => {
    setSelectedIds(additive ? prev => new Set([...prev, ...ids]) : ids)
  }, [])
  const { containerRef: marqueeContainerRef, marqueeStyle, preSelectedIds,
    onPointerDown: onMarqueeDown, onPointerMove: onMarqueeMove, onPointerUp: onMarqueeUp, onPointerCancel: onMarqueeCancel } = useMarqueeSelection(handleMarqueeSelect)

  const [sortField, setSortField] = useState<'name' | 'size' | 'date' | 'type'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const [menu, setMenu] = useState<MenuTarget>(null)
  const [emptyMenu, setEmptyMenu] = useState<{ x: number; y: number } | null>(null)
  const { open: batchOpen, items: batchItems, close: closeBatch } = useBatchRenameStore()
  const [moveTarget, setMoveTarget] = useState<{ type: 'folder'; item: Folder } | { type: 'file'; item: FileItem } | null>(null)
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null)
  const [infoTarget, setInfoTarget] = useState<InfoTarget | null>(null)
  const [versionTarget, setVersionTarget] = useState<FileItem | null>(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null)
  const [textFile, setTextFile] = useState<FileItem | null>(null)

  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [draggingItem, setDraggingItem] = useState<{ type: 'folder' | 'file'; id: string } | null>(null)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [importMenu, setImportMenu] = useState<{ x: number; y: number } | null>(null)

  // ── Données via la source ───────────────────────────────────────────────────
  const { data: root, isLoading: rootLoading } = useQuery({
    queryKey: ['explorer', src.key, '#root'],
    queryFn: () => src.resolveRoot(),
    staleTime: 30_000,
  })
  const effectiveFolderId = currentFolderId ?? root?.id ?? null
  const rootResolved = root !== undefined && root !== null

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

  const isMenuItemPlaying = useMemo(() => menu?.type === 'file' && playingFileIds.has((menu.item as FileItem).id), [menu, playingFileIds])
  const hasPlayingInSelection = useMemo(() => [...selectedIds].some(id => playingFileIds.has(id)), [selectedIds, playingFileIds])

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
      else if (sortField === 'type') cmp = a.mime_type.localeCompare(b.mime_type)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [files, typeFilter, sortField, sortDir, showHidden])

  const sortedFolders = useMemo(() => [...folders].sort((a, b) => sortDir === 'asc' ? a.name.localeCompare(b.name, 'fr') : b.name.localeCompare(a.name, 'fr')), [folders, sortDir])
  const orderedIds = useMemo(() => [...sortedFolders.map(f => f.id), ...filteredFiles.map(f => f.id)], [sortedFolders, filteredFiles])
  const allItemsSelected = orderedIds.length > 0 && orderedIds.every(id => selectedIds.has(id))
  const toggleSelectAll = () => allItemsSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(orderedIds))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        if (orderedIds.length === 0) return
        e.preventDefault(); setSelectedIds(new Set(orderedIds))
      } else if (e.key === 'Escape' && selectedIds.size > 0) setSelectedIds(new Set())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [orderedIds, selectedIds.size])

  // ── Navigation ───────────────────────────────────────────────────────────────
  // Écrit la position dans l'URL (paramètre `pathParam`) si demandé — permet à la
  // sidebar de piloter le volet principal et le deep-link (cas distant : id = chemin).
  const writeUrl = useCallback((id: string | null) => {
    if (!pathParam) return
    setSearchParams(prev => {
      const n = new URLSearchParams(prev)
      if (id) n.set(pathParam, id); else n.delete(pathParam)
      return n
    }, { replace: false })
  }, [pathParam, setSearchParams])

  function navigateTo(folder: Folder) {
    setCurrentFolderId(folder.id)
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }])
    setSelectedIds(new Set())
    writeUrl(folder.id)
  }
  function navigateUp(idx: number) {
    if (idx < 0) { setCurrentFolderId(null); setBreadcrumbs([]); writeUrl(null) }
    else { setCurrentFolderId(breadcrumbs[idx].id); setBreadcrumbs(breadcrumbs.slice(0, idx + 1)); writeUrl(breadcrumbs[idx].id) }
    setSelectedIds(new Set())
  }

  // Sync URL → état (navigation déclenchée par la sidebar ou un deep-link).
  // Le fil d'Ariane est reconstruit via `resolveAncestors` → marche pour des ids
  // chemin (distant) comme UUID (local, noms d'ancêtres résolus via l'API).
  const urlPath = pathParam ? (searchParams.get(pathParam) ?? '') : ''
  useEffect(() => {
    if (!pathParam) return
    const cur = currentFolderId ?? ''
    if (urlPath === cur) return
    setCurrentFolderId(urlPath || null)
    setSelectedIds(new Set())
    if (!urlPath) { setBreadcrumbs([]); return }
    let alive = true
    src.resolveAncestors(urlPath).then(a => { if (alive) setBreadcrumbs(a) }).catch(() => {})
    return () => { alive = false }
  }, [urlPath, pathParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sélection ──────────────────────────────────────────────────────────────────
  const handleItemSelect = useCallback((id: string, e: React.MouseEvent) => {
    const currentIdx = orderedIds.indexOf(id)
    if (e.shiftKey && lastSelectedIdxRef.current >= 0) {
      const from = Math.min(lastSelectedIdxRef.current, currentIdx), to = Math.max(lastSelectedIdxRef.current, currentIdx)
      const range = orderedIds.slice(from, to + 1)
      setSelectedIds(prev => { const next = new Set(prev); range.forEach(r => next.add(r)); return next })
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
      lastSelectedIdxRef.current = currentIdx
    } else { setSelectedIds(new Set([id])); lastSelectedIdxRef.current = currentIdx }
  }, [orderedIds])
  const handleItemToggle = useCallback((id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
    lastSelectedIdxRef.current = orderedIds.indexOf(id)
  }, [orderedIds])

  const invalidate = useCallback(() => { qc.invalidateQueries({ queryKey: ['explorer', src.key] }); refreshUser() }, [qc, src.key, refreshUser])

  // ── Upload ──────────────────────────────────────────────────────────────────
  const [uploadConflictQueue, setUploadConflictQueue] = useState<Array<{ file: File; folderId: string | null }>>([])
  const uploadFileTracked = useCallback((file: File, targetFolderId: string | null, overwrite = false) => {
    const id = crypto.randomUUID()
    addUpload({ id, name: file.name, progress: 0, status: 'uploading' })
    src.uploadFile(file, targetFolderId, pct => updateUpload(id, { progress: pct }), overwrite)
      .then((result) => {
        if (!result) { updateUpload(id, { status: 'error', error: t('app.module_unavailable') }); return }
        updateUpload(id, { progress: 100, status: 'done' }); invalidate()
      })
      .catch(err => updateUpload(id, { status: 'error', error: (err as Error).message ?? t('common.error') }))
  }, [addUpload, updateUpload, invalidate, src, t])
  const handleUploadConflictChoice = useCallback((choice: ConflictChoice) => {
    setUploadConflictQueue(prev => { const [cur, ...rest] = prev; if (cur && choice !== 'cancel') uploadFileTracked(cur.file, cur.folderId, choice === 'overwrite'); return rest })
  }, [uploadFileTracked])
  const enqueueUpload = useCallback((file: File, targetFolderId: string | null) => {
    const hasConflict = rawFiles.some(f => f.name === file.name)
    if (hasConflict && targetFolderId === effectiveFolderId) setUploadConflictQueue(prev => [...prev, { file, folderId: targetFolderId }])
    else uploadFileTracked(file, targetFolderId)
  }, [rawFiles, effectiveFolderId, uploadFileTracked])
  const processEntry = useCallback(async (entry: FileSystemEntry, parentFolderId: string | null): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej))
      uploadFileTracked(file, parentFolderId)
    } else if (entry.isDirectory && caps.mkdir) {
      await src.createFolder(entry.name, parentFolderId)
      qc.invalidateQueries({ queryKey: ['explorer', src.key] })
      // Après mkdir on ne connaît pas l'id distant exact → on liste pour retrouver.
      const { folders: fs } = await src.list(parentFolderId)
      const created = fs.find(f => f.name === entry.name)
      if (created) { const entries = await readAllEntries((entry as FileSystemDirectoryEntry).createReader()); for (const c of entries) await processEntry(c, created.id) }
    }
  }, [uploadFileTracked, qc, src, caps.mkdir])
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files ?? []).forEach(f => enqueueUpload(f, effectiveFolderId)); e.target.value = '' }

  // Import d'un DOSSIER (<input webkitdirectory>) : reconstruit l'arborescence à
  // partir de `webkitRelativePath`, en créant les dossiers manquants à la volée.
  const handleFolderInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); e.target.value = ''
    if (!files.length || !caps.mkdir) return
    const folderId = new Map<string, string | null>([['', effectiveFolderId]])
    for (const file of files) {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      const parts = rel.split('/'); parts.pop()
      let parentId = effectiveFolderId; let acc = ''
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part
        if (!folderId.has(acc)) {
          await src.createFolder(part, parentId)
          const { folders } = await src.list(parentId)
          folderId.set(acc, folders.find(f => f.name === part)?.id ?? parentId)
        }
        parentId = folderId.get(acc) ?? parentId
      }
      enqueueUpload(file, parentId)
    }
  }

  // Nouveau dossier (modale locale ou prompt distant).
  const openNewFolder = useCallback(() => {
    if (caps.richModals) { setNewFolderOpen(true); return }
    void (async () => {
      const n = await prompt({ title: t('newfolder.title', { defaultValue: 'Nouveau dossier' }), defaultValue: '' })
      if (n) { await src.createFolder(n, effectiveFolderId); invalidate() }
    })()
  }, [caps.richModals, src, effectiveFolderId, invalidate, t])

  // Expose les déclencheurs au parent (bouton « Nouveau » de la sidebar).
  useEffect(() => {
    onRegisterActions?.({
      importFiles:  () => fileInputRef.current?.click(),
      importFolder: () => folderInputRef.current?.click(),
      newFolder:    openNewFolder,
    })
  }, [onRegisterActions, openNewFolder])

  // ── Drag & drop ───────────────────────────────────────────────────────────────
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
    if (entries.length > 0) entries.forEach(en => processEntry(en, targetFolderId))
    else Array.from(e.dataTransfer.files).forEach(f => enqueueUpload(f, targetFolderId))
  }, [effectiveFolderId, draggingItem, selectedIds, itemTypeMap, processEntry, enqueueUpload, invalidate, caps, folders, files, src, onExternalDrop])

  // ── Suppression différée (5 s) ──────────────────────────────────────────────
  const scheduleDelete = (items: PendingItem[]) => {
    if (items.length === 0) return
    const kind: DeletionKind = caps.trash ? 'trash' : 'permanent'
    usePendingDeletionStore.getState().schedule({
      kind, items,
      label: t(kind === 'permanent' ? 'app.del_pending_perm' : 'app.del_pending_trash', { count: items.length }),
      undoLabel: t('common.cancel'),
      commit: (its) => {
        const refs: ItemRef[] = its.map(it => ({ id: it.id, type: it.type, name: '' }))
        return (caps.trash ? src.trash(refs) : src.remove(refs)).then(() => { invalidate() })
      },
    })
  }

  // ── Menu contextuel ──────────────────────────────────────────────────────────
  const openMenu = (e: React.MouseEvent, type: 'folder' | 'file', item: Folder | FileItem) => {
    e.preventDefault(); e.stopPropagation()
    setMenu({ type, item, x: Math.min(e.clientX, window.innerWidth - 220), y: Math.min(e.clientY, window.innerHeight - 360) } as MenuTarget)
  }
  const asRef = (m: NonNullable<MenuTarget>): ItemRef => ({ id: m.item.id, type: m.type, name: m.item.name })

  const doRename = async () => {
    if (!menu) return
    if (caps.richModals) {
      const multi = selectedIds.size > 1 && selectedIds.has(menu.item.id)
      const ids = multi ? [...selectedIds] : [menu.item.id]
      const out: BatchRenameItem[] = []
      for (const id of ids) {
        const fo = folders.find(x => x.id === id); if (fo) { out.push({ id: fo.id, name: fo.name, type: 'folder' }); continue }
        const fi = files.find(x => x.id === id); if (fi) out.push({ id: fi.id, name: fi.name, type: 'file' })
      }
      useBatchRenameStore.getState().start(out)
    } else {
      const nn = await prompt({ title: t('common.rename', { defaultValue: 'Renommer' }), defaultValue: menu.item.name })
      if (nn && nn !== menu.item.name) { await src.rename(asRef(menu), nn); invalidate() }
    }
  }

  const handleGetLink = async () => {
    if (!menu) return
    try {
      const opts = menu.type === 'file' ? { file_id: menu.item.id, can_download: true } : { folder_id: menu.item.id, can_download: true }
      const { share } = await filesApi.createShare(opts)
      if (share.token) await navigator.clipboard.writeText(`${window.location.origin}/api/v1/drive/share/${share.token}`)
    } catch { /* ignore */ }
  }

  const handlePaste = (targetFolderId: string | null) => {
    if (!clipboard) return
    const ref: ItemRef = { id: clipboard.id, type: clipboard.type, name: clipboard.name }
    if (clipboard.action === 'copy') src.copy(ref, targetFolderId).then(invalidate)
    else src.move(ref, targetFolderId).then(() => { invalidate(); clearClipboard() })
  }

  // Ouvre un fichier en cherchant l'expérience la plus proche du local :
  // 1) handler du module, 2) visionneuse intégrée (image/vidéo/audio/pdf/texte),
  // 3) « ouvrir avec » l'éditeur associé (matérialisation pour le distant),
  // 4) repli téléchargement.
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
    if (pref?.open) { pref.open(file, navigate); return true }
    const opener = FileTypeRegistry.openersFor(file)[0]
    if (opener?.open) { opener.open(file, navigate); return true }
    return false
  }
  const openFile = async (file: FileItem) => {
    if (onOpenFile && onOpenFile(file)) return
    if (isViewable(file)) { setViewerFile(file); return }
    // Préférence explicite « Ouvrir avec » (métadonnée par-fichier) : priorité absolue.
    const hasExplicit = typeof file.metadata?.['open_with'] === 'string'
    if (hasExplicit && caps.openWith && openWithRegistry(file)) return
    // Texte → visionneuse rapide par défaut (un éditeur reste accessible via « Ouvrir avec »).
    if (isTextFile(file)) { setTextFile(file); return }
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

  // ── Rendu ────────────────────────────────────────────────────────────────────
  const isEmpty = !isLoading && folders.length === 0 && filteredFiles.length === 0
  const hideType = (!!acceptedMimeTypes && acceptedMimeTypes.length > 0) || !!fileTypeModuleId

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-white"
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={e => handleDrop(e)}>
      <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileInput} />
      {/* @ts-expect-error webkitdirectory n'est pas dans les types React */}
      <input ref={folderInputRef} type="file" hidden webkitdirectory="" directory="" onChange={handleFolderInput} />

      {importMenu && importMenuItems && (
        <MenuDropdown items={[{ type: 'action', label: t('common.import'), icon: <Upload size={15} />, onClick: () => fileInputRef.current?.click() }, { type: 'separator' }, ...importMenuItems]}
          pos={{ top: importMenu.y, left: importMenu.x }} onClose={() => setImportMenu(null)} />
      )}

      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-primary/5 transition-all">
          <CloudUpload size={52} className="text-primary opacity-80" />
          <p className="text-primary font-medium text-sm">{t('mfb.drop_here')}</p>
        </div>
      )}

      {/* En-tête : titre/fil d'ariane + actions */}
      <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-3 flex-shrink-0">
        <StorageBreadcrumb
          rootName={title}
          crumbs={breadcrumbs}
          onNavigate={navigateUp}
          childFolders={sortedFolders}
          onOpenChild={navigateTo}
          ariaLabel={t('app.breadcrumb')}
        />

        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-sm text-text-secondary">{t('storage.selected', { count: selectedIds.size })}</span>
              <Button variant={allItemsSelected ? 'secondary' : 'primary'} size="sm" icon={allItemsSelected ? <CheckSquare size={14} /> : <ListChecks size={14} />} onClick={toggleSelectAll}>
                {allItemsSelected ? t('app.deselect_all') : t('app.select_all')}
              </Button>
              {caps.delete && (
                <Button variant="danger" size="sm" icon={<Trash2 size={14} />} disabled={hasPlayingInSelection}
                  onClick={() => { scheduleDelete([...selectedIds].map(id => ({ id, type: itemTypeMap.get(id) === 'file' ? 'file' : 'folder' }))); setSelectedIds(new Set()) }}>
                  {t('common.delete')}
                </Button>
              )}
              <button onClick={() => setSelectedIds(new Set())} className="p-1.5 rounded-full hover:bg-surface-2 text-text-tertiary transition-colors" title={t('app.cancel_selection')}><X size={16} /></button>
              <div className="w-px h-5 bg-border" />
            </>
          ) : (
            <>
              {caps.upload && !hideImport && (
                importMenuItems && importMenuItems.length > 0 ? (
                  <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setImportMenu({ x: r.left, y: r.bottom + 4 }) }}>
                    {t('common.import')}<ChevronDown size={13} className="ml-1 -mr-1 opacity-70" />
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>{t('common.import')}</Button>
                )
              )}
              {caps.mkdir && <Button variant="secondary" size="sm" icon={<FolderPlus size={14} />} onClick={openNewFolder}>{t('newfolder.title')}</Button>}
            </>
          )}
          {toolbarContent && <div className="flex items-center gap-2">{toolbarContent}</div>}
        </div>
      </div>

      {/* Contenu défilable */}
      <div ref={marqueeContainerRef} className="flex-1 min-h-0 overflow-y-auto px-6 pb-6"
        onContextMenu={e => {
          // Sur le Drive principal (source locale, route /drive), le menu de fond est fourni
          // par le ContextMenuProvider du core (FilesContextMenuItems) → laisser remonter,
          // ne pas ouvrir le menu local (sinon DOUBLON). Pour les autres explorateurs
          // (module browsers, montages distants, système, volet distant), on gère localement
          // et on stoppe la propagation pour que le menu global ne s'ouvre pas en plus.
          if (src.key === 'local' && window.location.pathname.startsWith('/drive')) return
          e.preventDefault(); e.stopPropagation(); setEmptyMenu({ x: e.clientX, y: e.clientY })
        }}
        onPointerDown={onMarqueeDown} onPointerMove={onMarqueeMove} onPointerUp={onMarqueeUp} onPointerCancel={onMarqueeCancel}>
        {rootLoading ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm py-16 justify-center"><Loader2 size={18} className="animate-spin" />{t('common.loading')}</div>
        ) : !rootResolved ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <FolderIcon size={48} className="text-text-tertiary opacity-30" />
            <p className="text-text-secondary text-sm">{t('mfb.folder_not_found')}</p>
            <p className="text-text-tertiary text-xs">{t('mfb.created_on_save')}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm py-16 justify-center"><Loader2 size={18} className="animate-spin" />{t('common.loading')}</div>
        ) : isEmpty ? (
          emptyState ? <>{emptyState}</> : (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <CloudUpload size={52} className="text-text-tertiary" />
              <p className="text-text-secondary text-sm">{t('app.empty_folder')}</p>
              {caps.upload && <p className="text-text-tertiary text-xs">{t('mfb.drop_hint')}</p>}
            </div>
          )
        ) : (
          <div className="space-y-6">
            {files.length > 0 && (
              <SortFilterBar sortField={sortField} sortDir={sortDir} typeFilter={typeFilter}
                onSortField={setSortField} onSortDir={setSortDir} onTypeFilter={setTypeFilter} hideType={hideType}
                viewMode={viewMode} onViewMode={setViewMode} compact={compact} onCompact={setCompact} showHidden={showHidden} onShowHidden={setShowHidden} />
            )}

            {sortedFolders.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">{t('app.folders')}</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
                  {sortedFolders.map(folder => (
                    <FolderCard key={folder.id} folder={folder} isDragTarget={dragOverFolderId === folder.id}
                      selected={selectedIds.has(folder.id)} preSelected={preSelectedIds.has(folder.id)} canMove={caps.move}
                      onSelect={handleItemSelect} onToggle={handleItemToggle} onOpen={() => navigateTo(folder)} onContextMenu={e => openMenu(e, 'folder', folder)}
                      onDragStart={(e) => { e.dataTransfer.setData(DND_MIME, JSON.stringify({ sourceKey: src.key, id: folder.id, type: 'folder', name: folder.name })); if (!selectedIds.has(folder.id)) { setSelectedIds(new Set([folder.id])); lastSelectedIdxRef.current = orderedIds.indexOf(folder.id) } setDraggingItem({ type: 'folder', id: folder.id }) }}
                      onDragOver={e => { if (caps.move) { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(folder.id) } }}
                      onDragLeave={() => setDragOverFolderId(null)} onDrop={e => handleDrop(e, folder.id)} />
                  ))}
                </div>
              </section>
            )}

            {filteredFiles.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
                  {t('app.files')}
                  {typeFilter && filteredFiles.length !== files.length && <span className="ml-2 normal-case font-normal text-text-tertiary">— {filteredFiles.length} / {files.length}</span>}
                </h2>
                {(() => {
                  const spec = VIEW_SPECS[viewMode]
                  if (spec.kind === 'icons') {
                    return (
                      <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill,minmax(${spec.min}px,1fr))`, gap: compact ? 6 : 12 }}>
                        {filteredFiles.map(file => {
                          const defaultCard = (
                            <FileCard key={file.id} file={file} thumb={src.thumbnail(file)} selected={selectedIds.has(file.id)} preSelected={preSelectedIds.has(file.id)}
                              canMove={caps.move} allowVideoPreview={caps.thumbnails === 'url'}
                              onSelect={handleItemSelect} onToggle={handleItemToggle} onContextMenu={e => openMenu(e, 'file', file)}
                              onDragStart={(e) => { e.dataTransfer.setData(DND_MIME, JSON.stringify({ sourceKey: src.key, id: file.id, type: 'file', name: file.name })); if (!selectedIds.has(file.id)) { setSelectedIds(new Set([file.id])); lastSelectedIdxRef.current = orderedIds.indexOf(file.id) } setDraggingItem({ type: 'file', id: file.id }) }}
                              onOpen={() => openFile(file)} thumbH={spec.thumbH} iconScale={spec.iconScale} dense={spec.dense} />
                          )
                          return <div key={file.id}>{renderFileCard ? renderFileCard(file, defaultCard) : defaultCard}</div>
                        })}
                      </div>
                    )
                  }
                  if (spec.kind === 'tiles') {
                    return (
                      <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill,minmax(${spec.min}px,1fr))`, gap: compact ? 6 : 10 }}>
                        {filteredFiles.map(file => (
                          <div key={file.id} className="border border-border rounded-lg overflow-hidden bg-white hover:border-border-strong transition-colors">
                            <FileRow file={file} thumb={src.thumbnail(file)} onContextMenu={e => openMenu(e, 'file', file)} onOpen={() => openFile(file)} hideMeta />
                          </div>
                        ))}
                      </div>
                    )
                  }
                  if (spec.multicol) {
                    return (
                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 2 }}>
                        {filteredFiles.map(file => <FileRow key={file.id} file={file} thumb={src.thumbnail(file)} onContextMenu={e => openMenu(e, 'file', file)} onOpen={() => openFile(file)} density="compact" hideMeta />)}
                      </div>
                    )
                  }
                  return (
                    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                      {filteredFiles.map(file => <FileRow key={file.id} file={file} thumb={src.thumbnail(file)} onContextMenu={e => openMenu(e, 'file', file)} onOpen={() => openFile(file)} density={spec.density} />)}
                    </div>
                  )
                })()}
              </section>
            )}
          </div>
        )}
      </div>

      {menu && (
        <MenuDropdown
          pos={{ top: menu.y, left: menu.x }}
          onClose={() => setMenu(null)}
          items={buildItemMenuItems(menu, t, {
            caps, isPlaying: isMenuItemPlaying, onClose: () => setMenu(null),
            onRename: doRename,
            onMove: () => { setMoveTarget({ type: menu.type, item: menu.item } as typeof moveTarget) },
            onStar: () => { src.star?.(asRef(menu)).then(invalidate) },
            onTrash: () => { scheduleDelete([{ id: menu.item.id, type: menu.type }]) },
            onDelete: () => { scheduleDelete([{ id: menu.item.id, type: menu.type }]) },
            onShare: () => { if (menu.type === 'file') setShareTarget({ type: 'file', item: menu.item as FileItem }); else setShareTarget({ type: 'folder', item: menu.item as Folder }) },
            onGetLink: handleGetLink,
            onInfo: () => { if (menu.type === 'file') setInfoTarget({ type: 'file', item: menu.item as FileItem }); else setInfoTarget({ type: 'folder', item: menu.item as Folder }) },
            onEditPaint: () => { if (menu.type === 'file') useFilesPaintStore.getState().openEditor(menu.item as FileItem) },
            onVersionHistory: () => { if (menu.type === 'file') setVersionTarget(menu.item as FileItem) },
            onDownload: () => { src.download(asRef(menu)) },
            onCut: () => { setClipboard({ action: 'cut', type: menu.type, id: menu.item.id, name: menu.item.name }) },
            onCopy: () => { setClipboard({ action: 'copy', type: menu.type, id: menu.item.id, name: menu.item.name }) },
            onPaste: () => handlePaste(menu.type === 'folder' ? menu.item.id : effectiveFolderId),
            onCompress: () => { const name = menu.item.name; if (menu.type === 'file') filesApi.compressDownload([menu.item.id], [], name + '.zip'); else filesApi.compressDownload([], [menu.item.id], name + '.zip') },
            onSetColor: (color) => { if (menu.type === 'folder') src.setFolderColor?.(menu.item.id, color).then(invalidate) },
            clipboard, fileContextActions,
          })}
        />
      )}

      {marqueeStyle && marqueeStyle.width > 2 && marqueeStyle.height > 2 && (
        <div className="pointer-events-none z-50 rounded border border-primary/50 bg-primary/10" style={marqueeStyle} />
      )}

      {emptyMenu && (
        <MenuDropdown pos={{ top: emptyMenu.y, left: emptyMenu.x }} onClose={() => setEmptyMenu(null)}
          items={[
            ...(caps.mkdir ? [{ type: 'action' as const, label: t('newfolder.title'), icon: <FolderPlus size={14} />, onClick: openNewFolder }] : []),
            { type: 'action' as const, label: t('actions.refresh'), icon: <RefreshCw size={14} />, onClick: () => { bumpAllImageCache(); invalidate() } },
          ]} />
      )}

      {/* Modales locales (gardées montées ; déclenchées seulement si richModals) */}
      {caps.richModals && <>
        <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} parentId={effectiveFolderId} />
        {batchOpen && <BatchRenameModal items={batchItems} onClose={closeBatch} />}
        <MoveModal target={moveTarget} onClose={() => setMoveTarget(null)} />
        <ShareModal target={shareTarget} onClose={() => setShareTarget(null)} />
        <FileInfoModal target={infoTarget} onClose={() => setInfoTarget(null)} />
        <VersionHistoryModal file={versionTarget} onClose={() => setVersionTarget(null)} />
      </>}

      <UploadPanel />

      {uploadConflictQueue.length > 0 && <ConflictDialog type="file" name={uploadConflictQueue[0].file.name} onChoice={handleUploadConflictChoice} />}
      {confirmState && <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />}
      {viewerFile && (() => {
        const isImg = viewerFile.mime_type.startsWith('image/')
        const gallery = isImg ? filteredFiles.filter(f => f.mime_type.startsWith('image/')) : [viewerFile]
        const start = Math.max(0, gallery.findIndex(f => f.id === viewerFile.id))
        return <MediaViewer files={gallery} start={start} contentOf={f => src.content(f)} onClose={() => setViewerFile(null)} />
      })()}

      {textFile && (
        <FilesTextViewer
          name={textFile.name}
          load={() => src.readBlob({ id: textFile.id, name: textFile.name })}
          onClose={() => setTextFile(null)}
        />
      )}
    </div>
  )
}
