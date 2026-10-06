import { type UiGroup, type Verdict } from "./condition";
import { type LeafContext } from "./leafKinds";
import type { RuleLimits } from "./types";
import { ViewBase } from './ConditionTree.kbview';
import * as __parts from './ConditionTree.parts';
interface Props {
    root: UiGroup;
    onChange: (next: UiGroup) => void;
    ctx: LeafContext;
    limits: RuleLimits;
    /** Verdicts of the last test run, by node id. Absent ⇒ no test has run. */
    verdicts?: Record<string, Verdict>;
    disabled?: boolean;
}
export type { Props };
export declare class ConditionTree extends ViewBase {
    tr: ConditionTreeStores['t'];
    depth: number;
    leaves: number;
    nodes: number;
    quotas: ConditionTreeHooks['quotas'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        depth: number;
        leaves: number;
        nodes: number;
        quotas: import("./leafKinds").LeafQuotaState[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get depthFull(): boolean;
    get leavesFull(): boolean;
    get span_class(): "text-text-tertiary" | "text-warning";
    get span_class2(): "text-text-tertiary" | "text-warning";
    /** The rows of the Repeater over `quotas`. */
    get rows_quotas(): {
        q: import("./leafKinds").LeafQuotaState;
        span_class: string;
        key: string;
    }[];
    /** `<TreeNode>`, rendered by a ReactHost. */
    get TreeNode(): typeof __parts.TreeNode;
    get tree_node_props(): {
        node: UiGroup;
        root: UiGroup;
        onChange: (next: UiGroup) => void;
        ctx: LeafContext;
        limits: RuleLimits;
        verdicts: Record<string, Verdict> | undefined;
        disabled: boolean | undefined;
        depth: number;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ConditionTreeStores = ReturnType<ConditionTree['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ConditionTreeHooks = ReturnType<ConditionTree['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
