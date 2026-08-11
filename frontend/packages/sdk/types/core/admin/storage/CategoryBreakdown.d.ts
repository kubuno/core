import { type CategoryReading, type CategoryRules } from './categories';
import type { CategoryUsage } from './api';
/**
 * Bytes a module caused but does not hold. Outside the bar, outside every sum,
 * and labelled as such — this note IS the anti-double-count rule made visible.
 */
export declare function DelegatedNote({ bytes, objects, scope, className, }: {
    bytes: number;
    objects: number;
    /** Changes only the wording; the arithmetic is the same everywhere: none. */
    scope?: 'instance' | 'module';
    className?: string;
}): import("react").JSX.Element | null;
/**
 * The full reading: one bar over what is physically held, the categories that
 * fill it, and the bin called out on its own.
 */
export declare function CategoryComposition({ reading, heldBytes, ariaLabel, delegatedBytes, delegatedObjects, }: {
    reading: CategoryReading;
    /** The server's own held total — the bar's denominator, not a re-derived sum. */
    heldBytes: number;
    ariaLabel: string;
    delegatedBytes: number;
    delegatedObjects: number;
}): import("react").JSX.Element;
/** A module's categories, without a bar — a detail panel, not a reading. */
export declare function CategoryRows({ rows, rules, }: {
    rows: CategoryUsage[];
    rules: CategoryRules;
}): import("react").JSX.Element;
