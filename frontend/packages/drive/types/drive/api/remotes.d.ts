import type { CreateRemoteDto, RemoteConnection, RemoteEntry, TestRemoteResult } from './types';
/** Remote mounts (external providers): connections and live browsing. */
export declare const remoteApi: {
    listRemotes: () => Promise<RemoteConnection[]>;
    createRemote: (dto: CreateRemoteDto) => Promise<{
        id: string;
        mount_name: string;
    }>;
    deleteRemote: (id: string) => Promise<void>;
    testRemote: (id: string) => Promise<TestRemoteResult>;
    browseRemote: (id: string, path: string) => Promise<RemoteEntry[]>;
    deleteRemoteEntry: (id: string, path: string) => Promise<void>;
    renameRemoteEntry: (id: string, path: string, to: string) => Promise<void>;
    createRemoteDir: (id: string, path: string) => Promise<void>;
    uploadRemoteFile: (id: string, path: string, data: Blob | File) => Promise<void>;
    fetchRemoteFileBlob: (id: string, path: string) => Promise<Blob>;
    downloadRemoteFile: (id: string, path: string, fileName: string) => Promise<void>;
};
