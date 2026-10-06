import type { MentionItem, MentionMatch } from './types';
export declare function ensureMentionStyles(): void;
/** The chip's marker so a delegated click handler can spot the × button. */
export declare const MENTION_REMOVE_ATTR = "data-kb-mention-remove";
/** Build the chip HTML (contenteditable=false island + clickable ×). */
export declare function buildMentionChipHtml(item: MentionItem): string;
/**
 * Replace the typed `@query` before the caret with a mention chip, inside the
 * current selection's contenteditable. Uses `execCommand('insertHTML', …)` on a
 * range that spans `@query`, which keeps the NATIVE undo stack intact (a manual
 * DOM splice would sever it — the lesson from the chat editor). Returns whether
 * the replacement succeeded.
 */
export declare function replaceMentionQueryWithChip(match: MentionMatch, item: MentionItem): boolean;
/**
 * Wire a delegated listener that removes a chip when its × is clicked. Returns a
 * cleanup function. Removal goes through `execCommand('delete')` on a range that
 * covers the chip so it too stays on the undo stack.
 */
export declare function bindMentionChipRemoval(root: HTMLElement, onAfterRemove?: () => void): () => void;
/**
 * Post-process mention HTML for storage/transport.
 *  - `'mailto'` (default): each `.kb-mention[data-email]` becomes
 *    `<a href="mailto:…">label</a>` (used by mail); chips without an email
 *    collapse to their plain label.
 *  - `'plain'`: every chip collapses to its plain label text.
 * Other modes are intentionally left for later (id-based refs, etc.).
 */
export declare function serializeMentions(html: string, mode?: 'mailto' | 'plain'): string;
