interface DocumentTitleState {
    fileName: string | null;
    setFileName: (name: string | null) => void;
}
export declare const useDocumentTitleStore: import("zustand").UseBoundStore<import("zustand").StoreApi<DocumentTitleState>>;
export {};
