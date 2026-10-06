import type { ComponentType, ReactNode } from 'react';
/**
 * Extra tabs for the image picker, contributed by modules.
 *
 * The core ships the sources it can implement on its own (URL, upload, webcam,
 * Drive through its published service). Anything that belongs to a module —
 * a Photos library, a stock-image search — is registered here, so the picker
 * gains it only when that module is installed. No cross-module import: the
 * module hands over a component, the core renders it.
 */
type Picked = {
    kind: 'url';
    url: string;
} | {
    kind: 'file';
    file: File;
};
export interface ImageSourceProps {
    /** Call with the chosen image(s); the dialog closes and resolves. */
    onPick: (result: Picked | Picked[]) => void;
    /** Live text from the dialog's own search box (empty unless `searchable`). */
    query: string;
    /** True when the caller accepts several images; sources may ignore it. */
    multiple: boolean;
}
export interface ImageSource {
    /** Stable id, also used as the tab key. */
    id: string;
    label: string;
    icon: ReactNode;
    /** Lower sorts first; core sources sit at 0, 10, 20… */
    order?: number;
    /** Show the dialog's search box and feed `query` to the component. */
    searchable?: boolean;
    searchPlaceholder?: string;
    /** 'library' browses a collection, 'device' pulls from this machine. The two
     *  groups are separated in the tab rail. */
    group?: 'library' | 'device';
    Component: ComponentType<ImageSourceProps>;
}
export declare const ImageSourceRegistry: {
    /** Register (or replace) a source. A module calls this in its `register()`. */
    add(source: ImageSource): void;
    remove(id: string): void;
    list(): ImageSource[];
    subscribe(fn: () => void): () => void;
};
export {};
