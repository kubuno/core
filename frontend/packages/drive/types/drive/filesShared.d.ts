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
import { type MenuItem } from '@ui';
type NavFn = (p: string) => void;
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
/** Grille de couleurs de dossier, embarquée dans le sous-menu « Organiser ». */
export declare function FolderColorGrid({ current, onPick }: {
    current?: string | null;
    onPick: (c: string | null) => void;
}): import("react").JSX.Element;
/** Construit l'item de menu natif « Ouvrir avec » (apps + contributeurs de modules). */
export declare function openWithMenuItem(file: FileItem, navigate: NavFn, tr: (k: string) => string): MenuItem;
/** Construit l'item de menu natif « Organiser » (Déplacer / Étoiler / couleur). */
export declare function organiseMenuItem(opts: {
    isFolder: boolean;
    starred: boolean;
    folderColor?: string | null;
    isProtected?: boolean;
    disabled?: boolean;
    onMove: () => void;
    onStar: () => void;
    onSetColor: (c: string | null) => void;
    tr: (k: string) => string;
}): MenuItem;
export {};
