/**
 * Internal shared types of the StorageExplorer parts.
 *
 * The PUBLIC types (`StorageExplorerProps`, `FileContextAction`,
 * `ExternalDragItem`) stay declared in `../StorageExplorer`: they belong to the
 * `@kubuno/drive` surface and must keep their declaration site.
 */
import type { Folder, FileItem } from '../api'

/** Target of the item context menu (anchored at the pointer position). */
export type MenuTarget =
  | { type: 'folder'; item: Folder;   x: number; y: number }
  | { type: 'file';   item: FileItem; x: number; y: number }
  | null

/** dataTransfer MIME carrying a cross-pane drag payload. */
export const DND_MIME = 'application/x-kubuno-item'

/** Minimal shape of the i18n `t` used by the explorer parts. */
export type TFunc = (key: string, opts?: Record<string, unknown>) => string

/** Sort criteria, shared by the toolbars, the details header and the lists. */
export type SortField = 'name' | 'size' | 'date' | 'type' | 'created'
