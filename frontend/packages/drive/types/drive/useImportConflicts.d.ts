export interface ImportTargetListing {
    files: {
        name: string;
    }[];
    folders: {
        id: string;
        name: string;
    }[];
}
export interface ImportConflictsOptions {
    /** List a folder's direct children (for conflict detection). */
    list: (folderId: string | null) => Promise<ImportTargetListing>;
    /** Create a folder and return its id (null if it couldn't be resolved → skip subtree). */
    createFolder: (name: string, parentId: string | null) => Promise<{
        id: string | null;
    }>;
    /** Fire-and-forget tracked upload (progress handled by the caller). */
    uploadFile: (file: File, folderId: string | null, overwrite: boolean) => void;
    /** Whether folders can be created in this source. */
    canMkdir?: boolean;
}
export declare function useImportConflicts({ list, createFolder, uploadFile, canMkdir }: ImportConflictsOptions): {
    importFiles: (files: File[], targetId: string | null) => Promise<void>;
    importEntries: (entries: FileSystemEntry[], targetId: string | null) => Promise<void>;
    importWebkitFolder: (files: File[], targetId: string | null) => Promise<void>;
    conflictDialog: import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | null;
};
