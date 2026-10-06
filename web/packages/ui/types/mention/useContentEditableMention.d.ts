import type { RefObject } from 'react';
import type { MentionsConfig } from './types';
/**
 * Attach the @mention behaviour to an existing contenteditable element (used by
 * both `RichText` and the mention variant of `Textarea`). Returns the event
 * handlers to spread on the editable plus the overlay node to render.
 *
 * When `config.enabled` is falsy every handler is a no-op and `overlay` is null,
 * so a host can wire these unconditionally without changing its behaviour.
 */
export declare function useContentEditableMention(ref: RefObject<HTMLElement | null>, config: MentionsConfig | undefined, onAfterChange?: () => void): {
    overlay: import("react").JSX.Element | null;
    onInput: () => void;
    onKeyUp: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    enabled: boolean;
};
