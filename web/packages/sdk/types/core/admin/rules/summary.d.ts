import type { TFunction } from 'i18next';
import { type UiNode } from './condition';
import { type LeafContext } from './leafKinds';
import type { ActionRow, RuleInput, TriggerRow } from './types';
export interface SummaryContext extends LeafContext {
    trigger: TriggerRow | undefined;
    actions: ActionRow[];
    /** Resolvers for the directory ids a scope names. Missing ⇒ the raw id. */
    unitName: (id: string) => string | undefined;
    groupName: (id: string) => string | undefined;
    userName: (id: string) => string | undefined;
}
/**
 * The whole rule as one paragraph, with `**…**` around what must not be skimmed.
 */
export declare function describeRule(input: RuleInput, tree: UiNode, ctx: SummaryContext, t: TFunction): string;
/** Splits a `**…**` string into its emphasised and plain runs. */
export declare function splitEmphasis(text: string): {
    text: string;
    strong: boolean;
}[];
