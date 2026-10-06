import type { Operator } from './types';
export type Json = unknown;
/** Walks a dotted path. `null` counts as absent, exactly like the server. */
export declare function lookup(facts: Json, path: string): Json | undefined;
/** One comparison, with the server's exact semantics. */
export declare function compare(actual: Json | undefined, op: Operator, expected: Json): boolean;
