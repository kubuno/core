import type { MentionItem, MentionMatch, MentionProvider } from './types';
export interface MentionCaretContext {
    /** Text from the start of the current line/node up to the caret. */
    textBeforeCaret: string;
    /** Viewport rect used to anchor the dropdown near the caret. */
    anchorRect: DOMRect | null;
}
export interface UseMentionAutocompleteOptions {
    /** Explicit providers; when omitted, falls back to the registered source. */
    providers?: MentionProvider[];
    /** Trigger character (default `'@'`). */
    trigger?: string;
    /** Max items shown / requested (default 6). */
    limit?: number;
    /** Debounce before hitting providers, in ms (default 150). */
    debounceMs?: number;
    /** Invoked when the user validates an item (Enter/Tab/click). */
    onSelect: (item: MentionItem, match: MentionMatch) => void;
}
/**
 * Headless autocomplete engine shared by an `<input>` and a contenteditable.
 * The caller feeds it the caret context on every change (`handleCaret`) and
 * forwards key events (`handleKeyDown`); the hook owns the trigger detection,
 * the debounced + abortable provider search (merged and deduped), and the
 * keyboard navigation. It renders nothing — pair it with `<MentionList>`.
 */
export declare function useMentionAutocomplete(opts: UseMentionAutocompleteOptions): {
    open: boolean;
    items: MentionItem[];
    activeIndex: number;
    query: string;
    anchorRect: DOMRect | null;
    loading: boolean;
    handleCaret: (ctx: MentionCaretContext) => void;
    handleKeyDown: (e: {
        key: string;
    }) => boolean;
    close: () => void;
    setActiveIndex: import("react").Dispatch<import("react").SetStateAction<number>>;
    selectItem: (it: MentionItem) => void;
    selectActive: () => void;
};
