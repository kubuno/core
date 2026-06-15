import { type ReactNode } from 'react';
import type { StartPageRecentItem, StartPageTab, MenuItem } from '@ui';
import { type FileContextAction } from './ModuleFileBrowser';
import { type FileItem } from './api';
export interface ModuleStartPageBrowse {
    folderPathPrefix: string;
    title: string;
    onOpenFile?: (file: FileItem) => boolean | void;
    fileTypeModuleId?: string;
    toolbarContent?: ReactNode;
    fileContextActions?: FileContextAction[];
    emptyState?: ReactNode;
    hideImport?: boolean;
    importMenuItems?: MenuItem[];
}
export interface ModuleStartPageProps {
    recentTitle?: string;
    recentIcon?: ReactNode;
    /** Récents de repli (avant résolution du dossier) — sinon dérivés des fichiers. */
    recentItems?: StartPageRecentItem[];
    recentEmpty?: ReactNode;
    browse: ModuleStartPageBrowse;
    browseLabel?: string;
    extraTabs?: StartPageTab[];
    defaultTab?: string;
}
export default function ModuleStartPage({ recentTitle, recentIcon, recentItems, recentEmpty, browse, browseLabel, extraTabs, defaultTab, }: ModuleStartPageProps): import("react").JSX.Element;
