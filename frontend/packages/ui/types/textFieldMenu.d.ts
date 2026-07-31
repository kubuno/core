export type TextTarget = {
    kind: 'field';
    el: HTMLInputElement | HTMLTextAreaElement;
} | {
    kind: 'rich';
    el: HTMLElement;
};
export declare const MOD: string;
export declare const SHIFT: string;
/** Finds the text entry area a `contextmenu` event landed in, if any. */
export declare function findTextTarget(node: EventTarget | null): TextTarget | null;
export declare function isEditable(target: TextTarget): boolean;
export declare function hasSelection(target: TextTarget): boolean;
/** True when the clipboard can be READ. Writing has an execCommand fallback, reading
 *  has none — and `navigator.clipboard` is absent outside a secure context (plain HTTP
 *  on anything other than localhost), so Paste has to be offered conditionally. */
export declare function canReadClipboard(): boolean;
export declare function undo(): void;
export declare function redo(): void;
export declare function deleteSelection(): void;
export declare function copySelection(target: TextTarget): Promise<void>;
export declare function cutSelection(target: TextTarget): Promise<void>;
export declare function pasteInto(target: TextTarget, plain: boolean): Promise<void>;
export declare function selectAll(target: TextTarget): void;
