import type { MentionMatch } from './types';
export interface HighlightSegment {
    text: string;
    hit: boolean;
}
/**
 * Split `label` into segments, marking the (first) run that matches `query`
 * accent- and case-insensitively. Returns a single non-hit segment when there
 * is no match or no query.
 */
export declare function highlightMatch(label: string, query: string): HighlightSegment[];
/**
 * Detect a trigger occurrence at the caret. The trigger must be preceded by the
 * start of text or a whitespace, and followed by non-space characters (which
 * form the query). Scans `textBeforeCaret` — the text from the start of the
 * current line/node up to the caret.
 */
export declare function detectMention(textBeforeCaret: string, trigger?: string): MentionMatch | null;
