/** What the caller gets back: either a URL to reference, or a file to store. */
export type ImagePickResult = {
    kind: 'url';
    url: string;
} | {
    kind: 'file';
    file: File;
};
export interface ImagePickerOptions {
    title?: string;
    /** Source ids to hide, e.g. ['webcam'] where a capture makes no sense. */
    exclude?: string[];
    /** Let the user bring back several images at once (upload tab). */
    multiple?: boolean;
}
interface Entry extends ImagePickerOptions {
    resolve: (value: ImagePickResult[] | null) => void;
}
interface Store {
    current: Entry | null;
    open: (options?: ImagePickerOptions) => Promise<ImagePickResult[] | null>;
    /** Sources hand over one or several results; the dialog closes either way. */
    pick: (value: ImagePickResult | ImagePickResult[]) => void;
    cancel: () => void;
}
export declare const useImagePickerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<Store>>;
/**
 * Opens the project's image picker and resolves with the chosen image, or null
 * if the user closes it. THE way to insert or upload an image anywhere in the
 * app — modules never build their own file input for that.
 *
 * Requires `<ImagePickerHost />` mounted once (App.tsx).
 */
export declare const openImagePicker: (options?: ImagePickerOptions) => Promise<ImagePickResult | null>;
/** Same picker, allowing several images at once. */
export declare const openImagePickerMany: (options?: ImagePickerOptions) => Promise<ImagePickResult[] | null>;
/**
 * Same picker, but always resolves to a File — for the callers that UPLOAD the
 * image rather than merely reference it. A picked URL is fetched here, because
 * an authenticated Drive/Photos URL is useless to whoever reads the result
 * later (an anonymous visitor, another server).
 *
 * Returns null if the user closes the picker.
 */
export declare function pickImageFile(options?: ImagePickerOptions): Promise<File | null>;
/** Same, for several images at once. */
export declare function pickImageFiles(options?: ImagePickerOptions): Promise<File[]>;
export {};
