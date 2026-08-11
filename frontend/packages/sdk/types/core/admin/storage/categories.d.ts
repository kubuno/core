import type { TFunction } from 'i18next';
import type { CatalogEntry, CategoryUsage } from './api';
/** The identifier the anti-double-count rule is expressed through. */
export declare const DELEGATED = "delegated";
/** The one an operator empties before granting more quota. */
export declare const TRASH = "trash";
/**
 * A readable name for a category id, including one this build predates.
 *
 * The fallback prints the raw identifier rather than "Other": an operator faced
 * with an unnamed slice can at least search for the word, and the alternative
 * silently merges two unrelated things under one label.
 */
export declare function categoryLabel(t: TFunction, id: string): string;
/** Whether this build knows the identifier by name. */
export declare function isKnownCategory(id: string): boolean;
export interface CategoryRules {
    /** Position in the server's catalog. Unknown ids sort last, but stay stable. */
    order: (id: string) => number;
    billable: (row: CategoryUsage) => boolean;
    held: (row: CategoryUsage) => boolean;
}
/**
 * The catalog turned into lookups.
 *
 * The row's own flags are the fallback, not the source: the catalog is what the
 * server calls authoritative, and a row that disagrees with it is a transport
 * accident rather than a second opinion.
 */
export declare function useCategoryRules(catalog: CatalogEntry[] | undefined): CategoryRules;
export interface CategorySlice {
    row: CategoryUsage;
    label: string;
    color: string;
    billable: boolean;
}
export interface CategoryReading {
    /** Held categories with a volume, in catalog order — never in rank order. */
    slices: CategorySlice[];
    /** Past the eight-hue scale, folded into one entry. `null` when it is empty. */
    folded: {
        count: number;
        bytes: number;
    } | null;
    /** Everything held, as the rows account for it. */
    heldBytes: number;
    /** The share of that which is charged to a quota. */
    billedBytes: number;
    /** The row the operator is asked to look at first, if it carries anything. */
    trash: CategoryUsage | null;
}
/**
 * Turns a category list into something drawable.
 *
 * Colour is bound to the category's place in the **catalog**, filtered to the
 * categories actually present: a category keeps its hue as the numbers move, and
 * the scale is not spent on rows that draw nothing. `delegated` is excluded here
 * by its own `held: false` — it belongs to no total, and every caller renders it
 * separately and says so.
 */
export declare function useCategoryReading(rows: CategoryUsage[] | undefined, rules: CategoryRules, t: TFunction): CategoryReading;
