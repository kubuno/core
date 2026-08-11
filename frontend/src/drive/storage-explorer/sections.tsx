/**
 * The item area itself: the folders section, the files section (both switching
 * layout on the active `ViewMode`) and the Windows-Explorer-like details table.
 * Every layout reuses the SAME row/card props bag, so the operations
 * (selection/checkbox/marquee/drag/menu/open/cursor) are identical in all views.
 */
import React from 'react'
import type { Folder, FileItem } from '../api'
import type { ThumbSpec } from '../storageSource'
import { VIEW_SPECS, type ViewMode } from '../fileView'
import { FolderCard, FileCard, FolderRow, FileRow } from './themed'
import { DetailsHeader } from './DetailsHeader'
import type { DetailsColsView, DetailsSettings, DetailsSortField } from './detailsModel'
import type { TFunc } from './types'

/** Props shared by every folder rendering (card or row), whatever the view. */
export type FolderCommonProps = {
  folder: Folder; isDragTarget: boolean
  selected: boolean; preSelected?: boolean; focused?: boolean; canMove: boolean
  onSelect: (id: string, e: React.MouseEvent) => void; onToggle: (id: string) => void; onOpen: () => void
  onContextMenu: (e: React.MouseEvent) => void; onLongPress?: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void; onDrop: (e: React.DragEvent) => void
}
/** Props shared by every file rendering (card or row), whatever the view. */
export type FileCommonProps = {
  file: FileItem; thumb: ThumbSpec
  selected: boolean; preSelected?: boolean; focused?: boolean; canMove: boolean
  onSelect: (id: string, e: React.MouseEvent) => void; onToggle: (id: string) => void
  onContextMenu: (e: React.MouseEvent) => void; onLongPress?: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void; onOpen: () => void
}

export function FoldersSection({ visibleFolders, view, compact, isMobile, selectedIds, folderRowProps, t }: {
  visibleFolders: Folder[]; view: ViewMode; compact: boolean; isMobile: boolean
  selectedIds: Set<string>; folderRowProps: (f: Folder) => FolderCommonProps; t: TFunc
}) {
  const spec = VIEW_SPECS[view]
  // Mêmes opérations dans toutes les vues : carte en icônes, ligne sinon.
  const common = folderRowProps
  const body = (() => {
    if (spec.kind === 'icons') {
      // Mobile : dossiers à pleine largeur, un par ligne (une carte
      // dossier est une puce horizontale nom+kebab — 2 colonnes
      // tronquaient le nom). Desktop : `minmax(200px,…)` auto-fill.
      return (
        <div className="grid gap-2" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(200px,1fr))' }}>
          {visibleFolders.map(f => <FolderCard key={f.id} {...common(f)} />)}
        </div>
      )
    }
    const dens = spec.multicol ? 'compact' : (spec.density ?? 'normal')
    if (spec.kind === 'tiles') {
      return <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill,minmax(${spec.min}px,1fr))`, gap: compact ? 6 : 10 }}>{visibleFolders.map(f => <div key={f.id} className="border border-border rounded-lg overflow-hidden bg-white"><FolderRow {...common(f)} density="normal" /></div>)}</div>
    }
    if (spec.multicol) {
      return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 2 }}>{visibleFolders.map(f => <FolderRow key={f.id} {...common(f)} density="compact" />)}</div>
    }
    return <div className="rounded-xl border border-border overflow-hidden">{visibleFolders.map((f, i) => <FolderRow key={f.id} {...common(f)} density={dens} zebra={i % 2 === 0} mergeTop={i > 0 && selectedIds.has(visibleFolders[i - 1].id)} mergeBottom={i < visibleFolders.length - 1 && selectedIds.has(visibleFolders[i + 1].id)} />)}</div>
  })()
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">{t('app.folders')}</h2>
      {body}
    </section>
  )
}

export function FilesSection({ visibleFiles, filteredFiles, files, typeFilter, view, compact, isMobile, selectedIds, fileRowProps, renderFileCard, allowVideoPreview, t }: {
  visibleFiles: FileItem[]; filteredFiles: FileItem[]; files: FileItem[]; typeFilter: string | null
  view: ViewMode; compact: boolean; isMobile: boolean; selectedIds: Set<string>
  fileRowProps: (f: FileItem) => FileCommonProps
  renderFileCard?: (file: FileItem, defaultCard: React.ReactNode) => React.ReactNode
  allowVideoPreview: boolean; t: TFunc
}) {
  const spec = VIEW_SPECS[view]
  // Props communs → MÊMES opérations (sélection/case/marquee/glisser/
  // menu/ouverture/curseur) quelle que soit la vue.
  const common = fileRowProps
  const body = (() => {
    if (spec.kind === 'icons') {
      return (
        <div className="grid" style={{ gridTemplateColumns: isMobile ? 'repeat(2,minmax(0,1fr))' : `repeat(auto-fill,minmax(${spec.min}px,1fr))`, gap: compact ? 6 : 12 }}>
          {visibleFiles.map(file => {
            const defaultCard = (
              <FileCard {...common(file)} allowVideoPreview={allowVideoPreview} thumbH={spec.thumbH} iconScale={spec.iconScale} dense={spec.dense} />
            )
            return <div key={file.id}>{renderFileCard ? renderFileCard(file, defaultCard) : defaultCard}</div>
          })}
        </div>
      )
    }
    if (spec.kind === 'tiles') {
      return (
        <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill,minmax(${spec.min}px,1fr))`, gap: compact ? 6 : 10 }}>
          {visibleFiles.map(file => (
            <div key={file.id} className="border border-border rounded-lg overflow-hidden bg-white hover:border-border-strong transition-colors">
              <FileRow {...common(file)} hideMeta />
            </div>
          ))}
        </div>
      )
    }
    if (spec.multicol) {
      return (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 2 }}>
          {visibleFiles.map(file => <FileRow key={file.id} {...common(file)} density="compact" hideMeta />)}
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-border overflow-hidden">
        {visibleFiles.map((file, i) => <FileRow key={file.id} {...common(file)} density={spec.density} zebra={i % 2 === 0} mergeTop={i > 0 && selectedIds.has(visibleFiles[i - 1].id)} mergeBottom={i < visibleFiles.length - 1 && selectedIds.has(visibleFiles[i + 1].id)} />)}
      </div>
    )
  })()
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
        {t('app.files')}
        {typeFilter && filteredFiles.length !== files.length && <span className="ml-2 normal-case font-normal text-text-tertiary">— {filteredFiles.length} / {files.length}</span>}
      </h2>
      {body}
    </section>
  )
}

// « Details » view: a single Windows-Explorer-like table (folders first, then
// files) under a sortable, resizable column header. Full-bleed: no frame, and
// -mx-6 cancels the scroll container's horizontal padding so rows stretch edge
// to edge.
export function DetailsTable({ visibleFolders, visibleFiles, selectedIds, folderRowProps, fileRowProps, details, onDetails, detailsView, sortField, sortDir, onSortField, onSortDir, onHeaderMenu }: {
  visibleFolders: Folder[]; visibleFiles: FileItem[]; selectedIds: Set<string>
  folderRowProps: (f: Folder) => FolderCommonProps
  fileRowProps: (f: FileItem) => FileCommonProps
  details: DetailsSettings; onDetails: (updater: (s: DetailsSettings) => DetailsSettings) => void
  detailsView: DetailsColsView
  sortField: DetailsSortField; sortDir: 'asc' | 'desc'
  onSortField: (f: DetailsSortField) => void; onSortDir: (d: 'asc' | 'desc') => void
  onHeaderMenu: (e: React.MouseEvent) => void
}) {
  return (
    <section className="-mx-6">
      <DetailsHeader details={details} onDetails={onDetails}
        sortField={sortField} sortDir={sortDir} onSortField={onSortField} onSortDir={onSortDir}
        onHeaderMenu={onHeaderMenu} />
      <div>
        {visibleFolders.map((f, i) => <FolderRow key={f.id} {...folderRowProps(f)} cols={detailsView} zebra={i % 2 === 0}
          mergeTop={i > 0 && selectedIds.has(visibleFolders[i - 1].id)}
          mergeBottom={i < visibleFolders.length - 1 ? selectedIds.has(visibleFolders[i + 1].id) : (visibleFiles.length > 0 && selectedIds.has(visibleFiles[0].id))} />)}
        {visibleFiles.map((file, i) => <FileRow key={file.id} {...fileRowProps(file)} cols={detailsView} zebra={(visibleFolders.length + i) % 2 === 0}
          mergeTop={i > 0 ? selectedIds.has(visibleFiles[i - 1].id) : (visibleFolders.length > 0 && selectedIds.has(visibleFolders[visibleFolders.length - 1].id))}
          mergeBottom={i < visibleFiles.length - 1 && selectedIds.has(visibleFiles[i + 1].id)} />)}
      </div>
    </section>
  )
}
