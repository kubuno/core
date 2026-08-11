import type { ComponentType } from 'react';
import type { TFunction } from 'i18next';
import type { Catalog, CondNode, TriggerRow } from './types';
import { type Json } from './compare';
/** Everything a leaf kind may need about the rule being edited. */
export interface LeafContext {
    trigger: TriggerRow | undefined;
    /**
     * The whole catalogue. A kind whose vocabulary is not carried by the trigger
     * reads it from here — the detector leaf names a detector, and the list of
     * detectors is served next to the triggers rather than inside one.
     */
    catalog: Catalog | undefined;
    t: TFunction;
}
export interface LeafEditorProps {
    node: CondNode;
    onChange: (next: CondNode) => void;
    ctx: LeafContext;
    disabled?: boolean;
}
/**
 * A ceiling that belongs to ONE kind, on top of the shared leaf budget.
 *
 * Declared here rather than read by the builder, for the same reason the rest
 * of this file exists: the builder counts nodes, it does not know what makes a
 * node expensive. A kind that costs a regex scan per content part says so, and
 * gets its counter and its refusal without ConditionTree growing a branch.
 */
export interface LeafQuota {
    /** From the catalogue. `undefined` ⇒ this build knows of no ceiling. */
    max: (ctx: LeafContext) => number | undefined;
    /** The counter, worded by the kind: "Détections 2 / 8". */
    label: (t: TFunction, used: number, max: number) => string;
    /** Shown when the tree already holds more than the ceiling. */
    over: (t: TFunction, max: number) => string;
}
export interface LeafKindDef {
    /** Wire discriminator (`node.type`). */
    type: string;
    /** Menu entry of "add a condition". */
    label: (t: TFunction) => string;
    /** Offered only when this answers true (defaults to always). */
    isAvailable?: (ctx: LeafContext) => boolean;
    create: (ctx: LeafContext) => CondNode;
    Editor: ComponentType<LeafEditorProps>;
    /** One clause of the natural-language summary. */
    describe: (node: CondNode, ctx: LeafContext, t: TFunction) => string;
    /**
     * Client-side refusal, worded for the operator. `null` ⇒ nothing to say.
     *
     * Only for what the server refuses too: the point is to spare a 422 the
     * operator meets ten minutes after writing the rule, never to invent a stricter
     * rule than the engine's.
     */
    validate?: (node: CondNode, ctx: LeafContext, t: TFunction) => string | null;
    quota?: LeafQuota;
    /**
     * Browser-side verdict. Return `'unknown'` when the kind genuinely cannot be
     * decided client-side — the tester then says so instead of guessing, which is
     * the difference between a debugger and a decoration.
     */
    evaluate: (node: CondNode, facts: Json) => boolean | 'unknown';
    /** Fragment merged into the prefilled sample fact of the tester. */
    sampleFacts?: (node: CondNode, ctx: LeafContext) => Record<string, unknown>;
}
export declare function registerLeafKind(def: LeafKindDef): void;
export declare function leafKinds(ctx: LeafContext): LeafKindDef[];
export declare function leafKindOf(node: CondNode): LeafKindDef | undefined;
export declare function isKnownLeaf(node: CondNode): boolean;
/** Verdict of one leaf, whatever its kind. Unknown kinds cannot be decided. */
export declare function evaluateLeaf(node: CondNode, facts: Json): boolean | 'unknown';
export declare function describeLeaf(node: CondNode, ctx: LeafContext, t: TFunction): string;
/**
 * Everything the leaves of a tree refuse, in the order they appear.
 *
 * An unknown kind contributes nothing: this build cannot judge somebody else's
 * leaf, and blocking a save on a shape it does not understand would make the
 * console the reason a rule cannot be edited.
 */
export declare function leafErrors(leaves: CondNode[], ctx: LeafContext, t: TFunction): string[];
/** One kind's ceiling, with how much of it is used. */
export interface LeafQuotaState {
    type: string;
    used: number;
    max: number;
    label: string;
    over: string;
}
/**
 * Per-kind counters, for the builder's counter row and for the save guard.
 *
 * A kind is listed as soon as it declares a ceiling this build can read — even
 * at zero, so an operator sees "Détections 0 / 8" before they need it rather
 * than discovering the ceiling by hitting it.
 */
export declare function leafQuotas(leaves: CondNode[], ctx: LeafContext, t: TFunction): LeafQuotaState[];
/** Sample fact contributed by one leaf, whatever its kind. */
export declare function sampleOfLeaf(node: CondNode, ctx: LeafContext): Record<string, unknown>;
