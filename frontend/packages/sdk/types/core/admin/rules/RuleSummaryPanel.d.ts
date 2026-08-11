import { type SummaryContext } from './summary';
import type { UiNode } from './condition';
import type { RuleInput } from './types';
import type { ScopePreview } from './useDirectory';
interface Props {
    input: RuleInput;
    tree: UiNode;
    ctx: SummaryContext;
    preview?: ScopePreview;
    /** Rendered as a plain block instead of a sticky column (mobile, dialogs). */
    flat?: boolean;
}
export declare function RuleSentence({ input, tree, ctx }: {
    input: RuleInput;
    tree: UiNode;
    ctx: SummaryContext;
}): import("react").JSX.Element;
export default function RuleSummaryPanel({ input, tree, ctx, preview, flat }: Props): import("react").JSX.Element;
export {};
