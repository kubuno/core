import { type StorageExplorerProps, type FileContextAction } from './StorageExplorer';
import { resolveRootFolder } from './storageSource';
export type { FileContextAction };
export { resolveRootFolder };
export interface ModuleFileBrowserProps {
    /** Préfixe du chemin du dossier racine (ex: "Office/Documents") */
    folderPathPrefix: string;
    title: string;
    onOpenFile?: StorageExplorerProps['onOpenFile'];
    fileContextActions?: FileContextAction[];
    toolbarContent?: StorageExplorerProps['toolbarContent'];
    hideImport?: boolean;
    importMenuItems?: StorageExplorerProps['importMenuItems'];
    renderFileCard?: StorageExplorerProps['renderFileCard'];
    emptyState?: StorageExplorerProps['emptyState'];
    acceptedMimeTypes?: string[];
    fileTypeModuleId?: string;
}
export default function ModuleFileBrowser(props: ModuleFileBrowserProps): import("react").JSX.Element;
