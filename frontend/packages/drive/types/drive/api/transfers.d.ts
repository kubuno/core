/** Thumbnails and downloads (URLs consumed directly by <img>/<a>, plus blobs). */
export declare const transferApi: {
    thumbnailUrl: (id: string) => string;
    downloadUrl: (id: string) => string;
    downloadBlob: (id: string) => Promise<Blob>;
};
