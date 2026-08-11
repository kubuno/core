import type { Folder } from '../api';
export declare function StorageBreadcrumbBase({ rootName, crumbs, onNavigate, childFolders, onOpenChild, ariaLabel }: {
    rootName: string;
    crumbs: Array<{
        id: string;
        name: string;
    }>;
    onNavigate: (idx: number) => void;
    childFolders: Folder[];
    onOpenChild: (folder: Folder) => void;
    ariaLabel?: string;
}): import("react").JSX.Element;
