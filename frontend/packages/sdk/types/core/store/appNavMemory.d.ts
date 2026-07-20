export declare const appNavMemory: {
    /** Last full path (pathname + search + hash) visited within the app, if any. */
    get(appId: string): string | undefined;
    set(appId: string, fullPath: string): void;
};
