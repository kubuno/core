import { type UiGroup, type UiNode, type Verdict } from "./condition";
import { type LeafContext } from "./leafKinds";
import type { RuleLimits } from "./types";
interface Props {
    root: UiGroup;
    onChange: (next: UiGroup) => void;
    ctx: LeafContext;
    limits: RuleLimits;
    /** Verdicts of the last test run, by node id. Absent ⇒ no test has run. */
    verdicts?: Record<string, Verdict>;
    disabled?: boolean;
}
declare function VerdictMark({ v }: {
    v: Verdict | undefined;
}): import("react").JSX.Element | null;
export { VerdictMark };
declare function GroupNode({ node, root, onChange, ctx, limits, verdicts, disabled, depth }: Props & {
    node: UiGroup;
    depth: number;
}): import("react").JSX.Element;
export { GroupNode };
declare function LeafNode({ node, root, onChange, ctx, verdicts, disabled }: Props & {
    node: UiNode;
}): import("react").JSX.Element | null;
export { LeafNode };
declare function TreeNode(props: Props & {
    node: UiNode;
    depth: number;
}): import("react").JSX.Element;
export { TreeNode };
