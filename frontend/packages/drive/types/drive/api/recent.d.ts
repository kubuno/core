import type { FileItem } from './types';
export type RecentFile = FileItem & {
    module_id: string;
    opened_at: string;
};
export declare const recentApi: {
    /** Records the opening of a file by an app (best-effort, non blocking). */
    record: (fileId: string, moduleId?: string) => void;
    /** Lists recently opened files (newest first), optionally filtered by app. */
    list: (opts?: {
        module?: string;
        limit?: number;
    }) => Promise<RecentFile[]>;
    remove: (fileId: string) => Promise<void>;
    clear: () => Promise<void>;
};
