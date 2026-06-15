/**
 * StorageExplorer — LA zone d'exploration de fichiers, générique et partagée par
 * TOUS les types de stockage (local + montages distants). Pilotée par une
 * `StorageSource` ; chaque source déclare ses capacités → on masque les fonctions
 * non supportées. Calqué visuellement sur « Mon Drive » (barre de sélection, tri/
 * type/affichage, dossiers/fichiers, multi-sélection, marquee, glisser-déposer,
 * menu contextuel). Cf. [[project_storage_explorer_generalized]].
 */
import React from 'react';
import { type FileItem } from './api';
import { type MenuItem } from '@ui';
import { type StorageSource } from './storageSource';
export interface FileContextAction {
    id: string;
    label: string;
    icon?: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
    danger?: boolean;
    visible?: (file: FileItem) => boolean;
    onClick: (file: FileItem) => void;
}
export interface StorageExplorerProps {
    /** Source de stockage. Par défaut = stockage local (`folderPathPrefix`). */
    source?: StorageSource;
    /** Préfixe racine pour la source locale par défaut (ex. "Office/Documents"). */
    folderPathPrefix?: string;
    title: string;
    onOpenFile?: (file: FileItem) => boolean | void;
    fileContextActions?: FileContextAction[];
    toolbarContent?: React.ReactNode;
    hideImport?: boolean;
    importMenuItems?: MenuItem[];
    renderFileCard?: (file: FileItem, defaultCard: React.ReactNode) => React.ReactNode;
    emptyState?: React.ReactNode;
    acceptedMimeTypes?: string[];
    fileTypeModuleId?: string;
    /** Dépôt d'un élément provenant d'une AUTRE source (vue double-volet). */
    onExternalDrop?: (payload: ExternalDragItem, targetParentId: string | null) => void;
    /** Synchronise la navigation avec un paramètre d'URL (ex. "path" pour le
     *  distant, "folder" pour le local). Le fil d'Ariane est reconstruit via
     *  `source.resolveAncestors`, donc valable pour des ids chemin OU UUID. */
    pathParam?: string;
    /** Expose les déclencheurs d'actions (Importer fichiers/dossier, Nouveau
     *  dossier) pour qu'un parent (ex. le bouton « Nouveau » de la sidebar) les
     *  pilote dans le dossier courant de CE composant. Appelé au montage. */
    onRegisterActions?: (a: {
        importFiles: () => void;
        importFolder: () => void;
        newFolder: () => void;
    }) => void;
}
/** Charge utile d'un glisser inter-volets (sérialisée dans le dataTransfer). */
export interface ExternalDragItem {
    sourceKey: string;
    id: string;
    type: 'file' | 'folder';
    name: string;
}
export default function StorageExplorer({ source, folderPathPrefix, title, onOpenFile, fileContextActions, toolbarContent, hideImport, importMenuItems, renderFileCard, emptyState, acceptedMimeTypes, fileTypeModuleId, onExternalDrop, pathParam, onRegisterActions, }: StorageExplorerProps): React.JSX.Element;
