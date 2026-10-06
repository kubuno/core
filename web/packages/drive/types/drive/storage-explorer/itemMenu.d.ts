import type { MenuItem } from '@ui';
import type { StorageSource } from '../storageSource';
import type { FileContextAction } from '../StorageExplorer';
import type { MenuTarget } from './types';
export interface ItemMenuHandlers {
    caps: StorageSource['capabilities'];
    navigate: (p: string) => void;
    onClose: () => void;
    onRename: () => void;
    onMove: () => void;
    onStar: () => void;
    onTrash: () => void;
    onDelete: () => void;
    onShare: () => void;
    onGetLink: () => void;
    onInfo: () => void;
    onEditPaint: () => void;
    onVersionHistory: () => void;
    onDownload: () => void;
    onCut: () => void;
    onCopy: () => void;
    onCopyCard: () => void;
    onPaste: () => void;
    onCompress: () => void;
    onSetColor: (color: string | null) => void;
    clipboard: {
        action: 'cut' | 'copy';
        type: 'file' | 'folder';
        id: string;
        name: string;
    } | null;
    fileContextActions?: FileContextAction[];
    isPlaying?: boolean;
}
export declare function buildItemMenuItems(menu: NonNullable<MenuTarget>, tr: (k: string) => string, h: ItemMenuHandlers): MenuItem[];
