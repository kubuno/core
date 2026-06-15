/**
 * filesShared — éléments communs aux deux navigateurs de fichiers
 * (`FilesApp` et `ModuleFileBrowser`) : palette de couleurs de dossier, icône de
 * fichier par type, et les sous-menus contextuels « Ouvrir avec » et « Organiser ».
 *
 * Source unique : éviter la double maintenance (toute correction ici profite aux
 * deux navigateurs).
 */
import { type ReactNode } from 'react';
import { type FileItem } from './api';
export declare const FOLDER_COLORS: Array<string | null>;
export declare function getFileIcon(mimeType: string, name?: string): ReactNode;
export declare function OpenWithSubmenu({ file, onClose }: {
    file: FileItem;
    onClose: () => void;
}): import("react").JSX.Element;
export declare function OrganiserSubmenu({ isFolder, starred, folderColor, isProtected, disabled, onMove, onStar, onSetColor, onClose, }: {
    isFolder: boolean;
    starred: boolean;
    folderColor?: string | null;
    isProtected?: boolean;
    disabled?: boolean;
    onMove: () => void;
    onStar: () => void;
    onSetColor: (color: string | null) => void;
    onClose: () => void;
}): import("react").JSX.Element;
