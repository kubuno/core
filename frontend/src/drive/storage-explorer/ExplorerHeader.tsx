/**
 * Top bar of the explorer: breadcrumb + actions, replaced on touch by a
 * selection bar as soon as one item is ticked (long-press to enter, tap to
 * (un)tick — the mobile-app flow).
 */
import React from 'react'
import { Upload, ChevronDown, Trash2, Download, FolderPlus, X, ListChecks, CheckSquare } from 'lucide-react'
import { Button, type MenuItem } from '@ui'
import type { Folder } from '../api'
import { StorageBreadcrumb } from './themed'
import type { TFunc } from './types'

export function ExplorerHeader({
  mobileSelecting, selectedIds, itemTypeMap, allItemsSelected, toggleSelectAll, clearSelection,
  onDownloadSelection, onDeleteSelection, canDelete, hasPlayingInSelection,
  title, breadcrumbs, onNavigate, childFolders, onOpenChild,
  isMobile, canUpload, hideImport, importMenuItems, onImport, onImportMenu, canMkdir, onNewFolder,
  toolbarContent, t,
}: {
  mobileSelecting: boolean
  selectedIds: Set<string>
  itemTypeMap: Map<string, 'file' | 'folder'>
  allItemsSelected: boolean
  toggleSelectAll: () => void
  clearSelection: () => void
  onDownloadSelection: () => void
  onDeleteSelection: () => void
  canDelete: boolean
  hasPlayingInSelection: boolean
  title: string
  breadcrumbs: Array<{ id: string; name: string }>
  onNavigate: (idx: number) => void
  childFolders: Folder[]
  onOpenChild: (folder: Folder) => void
  isMobile: boolean
  canUpload: boolean
  hideImport?: boolean
  importMenuItems?: MenuItem[]
  onImport: () => void
  onImportMenu: (e: React.MouseEvent) => void
  canMkdir: boolean
  onNewFolder: () => void
  toolbarContent?: React.ReactNode
  t: TFunc
}) {
  if (mobileSelecting) {
    return (
      <div className="flex items-center gap-0.5 px-1.5 pt-2 pb-2 flex-shrink-0 border-b border-border bg-[#e8f0fe]">
        <button onClick={clearSelection} className="p-2.5 rounded-full hover:bg-black/5 text-text-secondary transition-colors" title={t('app.cancel_selection')} aria-label={t('app.cancel_selection')}><X size={20} /></button>
        <span className="flex-1 min-w-0 text-base font-medium text-text-primary truncate px-1">{t('storage.selected', { count: selectedIds.size })}</span>
        <button onClick={toggleSelectAll} className="p-2.5 rounded-full hover:bg-black/5 text-text-secondary transition-colors" title={allItemsSelected ? t('app.deselect_all') : t('app.select_all')} aria-label={allItemsSelected ? t('app.deselect_all') : t('app.select_all')}>{allItemsSelected ? <CheckSquare size={20} /> : <ListChecks size={20} />}</button>
        {[...selectedIds].some(id => itemTypeMap.get(id) === 'file') && (
          <button onClick={onDownloadSelection} className="p-2.5 rounded-full hover:bg-black/5 text-text-secondary transition-colors" title={t('common.download')} aria-label={t('common.download')}><Download size={20} /></button>
        )}
        {canDelete && (
          <button disabled={hasPlayingInSelection} onClick={onDeleteSelection} className="p-2.5 rounded-full hover:bg-[#fce8e6] text-danger transition-colors disabled:opacity-40" title={t('common.delete')} aria-label={t('common.delete')}><Trash2 size={20} /></button>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 px-4 sm:px-6 pt-3 lg:pt-6 pb-3 flex-shrink-0">
      <StorageBreadcrumb
        rootName={title}
        crumbs={breadcrumbs}
        onNavigate={onNavigate}
        childFolders={childFolders}
        onOpenChild={onOpenChild}
        ariaLabel={t('app.breadcrumb')}
      />

      <div className="flex items-center flex-wrap justify-end gap-2 min-w-0">
        {selectedIds.size > 0 ? (
          <>
            <span className="text-sm text-text-secondary">{t('storage.selected', { count: selectedIds.size })}</span>
            <Button variant={allItemsSelected ? 'secondary' : 'primary'} size="sm" icon={allItemsSelected ? <CheckSquare size={14} /> : <ListChecks size={14} />} onClick={toggleSelectAll}>
              {allItemsSelected ? t('app.deselect_all') : t('app.select_all')}
            </Button>
            {canDelete && (
              <Button variant="danger" size="sm" icon={<Trash2 size={14} />} disabled={hasPlayingInSelection}
                onClick={onDeleteSelection}>
                {t('common.delete')}
              </Button>
            )}
            <button onClick={clearSelection} className="p-1.5 rounded-full hover:bg-surface-2 text-text-tertiary transition-colors" title={t('app.cancel_selection')}><X size={16} /></button>
            <div className="w-px h-5 bg-border" />
          </>
        ) : isMobile ? (
          // Sur mobile, « Importer » et « Nouveau dossier » vivent déjà dans le
          // FAB du shell (slot sidebar-new-actions) — les répéter ici mangerait
          // la largeur du fil d'Ariane pour rien.
          null
        ) : (
          <>
            {canUpload && !hideImport && (
              importMenuItems && importMenuItems.length > 0 ? (
                <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={onImportMenu}>
                  {t('common.import')}<ChevronDown size={13} className="ml-1 -mr-1 opacity-70" />
                </Button>
              ) : (
                <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={onImport}>{t('common.import')}</Button>
              )
            )}
            {canMkdir && <Button variant="secondary" size="sm" icon={<FolderPlus size={14} />} onClick={onNewFolder}>{t('newfolder.title')}</Button>}
          </>
        )}
        {toolbarContent && <div className="flex items-center gap-2">{toolbarContent}</div>}
      </div>
    </div>
  )
}
