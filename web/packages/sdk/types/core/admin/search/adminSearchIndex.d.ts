import type { LucideIcon } from 'lucide-react';
/** What a placeholder target loses. Large enough that it never wins a tie. */
export declare const SOON_PENALTY = 10000;
/** Placeholders are also barred from the first three rows outright. */
export declare const SOON_MIN_RANK = 3;
/** Splits a query into folded terms. Empty terms are dropped. */
export declare function queryTerms(q: string): string[];
/**
 * One entry, folded once: a search runs the whole catalogue on every keystroke,
 * so the normalisation must not be redone per comparison.
 */
export interface Folded {
    label: string;
    labelWords: string[];
    synonyms: string;
    synWords: string[];
    length: number;
}
export declare function fold(label: string, synonyms?: string): Folded;
/**
 * Score of a whole query. Returns 0 when any term is unmatched — the entry is
 * then not a result at all.
 */
export declare function scoreEntry(f: Folded, terms: string[]): number;
/**
 * Loose score, for "did you mean" suggestions on an empty result list: the best
 * single term wins, unmatched terms are forgiven. Never used for real results —
 * it would let one matching word drag in entries the operator did not ask for.
 */
export declare function scoreLoose(f: Folded, terms: string[]): number;
/** Categories, in the order they are painted. */
export type AdminResultKind = 'action' | 'user' | 'group' | 'org-unit' | 'module' | 'setting' | 'page';
export declare const KIND_ORDER: AdminResultKind[];
export interface AdminResult {
    /** Stable within a render — used as React key and as the ARIA option id. */
    key: string;
    kind: AdminResultKind;
    label: string;
    /** Second line: e-mail, description, setting key… */
    sublabel?: string;
    /** Menu path, shown as a breadcrumb under an action or a page. */
    segments?: string[];
    url: string;
    score: number;
    /** Target is a declared placeholder: badged, ranked down, kept out of the top. */
    soon?: boolean;
    Icon?: LucideIcon;
    /** Users only — the row paints the real avatar when there is one. */
    avatarUrl?: string | null;
}
/** Orders one category's hits (placeholders last, by construction) and caps them. */
export declare function rankCategory(results: AdminResult[], cap: number): AdminResult[];
/**
 * Keeps every placeholder behind every real result, list-wide.
 *
 * This is the strong form of "never a placeholder in the first three rows": a
 * target that does not exist yet can never displace one that does, whatever
 * category it came from. It can only surface near the top when there are fewer
 * than three real answers — which is to say, when there is nothing to hide it
 * behind and naming it is more useful than an empty list. It is badged either
 * way, so it is never mistaken for a working destination.
 */
export declare function demoteSoon(flat: AdminResult[]): AdminResult[];
/** One painted block: consecutive results of the same category. */
export interface ResultRun {
    kind: AdminResultKind;
    items: AdminResult[];
}
/**
 * Splits the flat, keyboard-ordered list into consecutive same-category runs.
 *
 * Painting from the flat order — instead of grouping by category and hoping the
 * two agree — is what makes arrow navigation match what the eye reads, even
 * after a placeholder has been demoted past the categories that follow it.
 */
export declare function groupRuns(flat: AdminResult[]): ResultRun[];
