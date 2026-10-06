interface ImageCacheState {
    versions: Record<string, number>;
    global: number;
    bump: (id: string) => void;
    bumpAll: () => void;
}
export declare const useImageCacheStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ImageCacheState>>;
export declare const bumpImageCache: (id: string) => void;
export declare const bumpAllImageCache: () => void;
export {};
