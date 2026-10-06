/**
 * The binding engine: path resolution (VIEWS-SPEC §6.1 resolution order: the innermost template row, then
 * outwards, then the view instance, then its `dataContext`), converters, formatting.
 */
import type { PlanBinding } from './plan';
/** A binding scope: the view instance, and the template rows around the element (innermost first). */
export interface Scope {
    readonly vm: Record<string, unknown> & {
        dataContext?: unknown;
    };
    readonly row?: unknown;
    readonly index?: number;
    readonly up?: Scope;
}
/** The path does not resolve. */
export declare const UNSET: unique symbol;
export interface ValueConverter {
    convert(value: unknown, parameter: string | undefined, culture: string | undefined): unknown;
    /** Absent: the converter does not convert back, a write-back through it is dropped. */
    convertBack?(value: unknown, parameter: string | undefined, culture: string | undefined): unknown;
}
/** Registers an application converter (it may replace a built-in one, VIEWS-SPEC §6.1). */
export declare function registerConverter(name: string, converter: ValueConverter): void;
/** The object owning the first segment of a path, by the resolution order. */
export declare function ownerOf(scope: Scope, first: string, depth: number): Record<string, unknown> | undefined;
/** The source value of a binding in `scope` (`UNSET` when it does not resolve). */
export declare function readSource(b: PlanBinding, scope: Scope): unknown;
/** The displayed value: source → converter → format, with `FallbackValue` / `TargetNullValue`. */
export declare function readBinding(b: PlanBinding, scope: Scope): unknown;
/** Writes a user change back to the source; `false` when it is refused (no setter, converter declines). */
export declare function writeBinding(b: PlanBinding, scope: Scope, value: unknown): boolean;
/** One value with a .NET-style format (`N2`, `C`, `d`, `dd/MM/yyyy`, `#,##0.00`). */
export declare function formatValue(v: unknown, f: string, culture?: string): string;
/** `StringFormat`: a composite (`'Total: {0:N2}'`) or a single format (`N2`). */
export declare function format(v: unknown, f: string, culture?: string): string;
