import type { CondNode, CompareNode } from './types';
import type { Json } from './compare';
export type { Json };
export { compare, lookup } from './compare';
export type GroupOp = 'all' | 'any' | 'none';
export interface UiGroup {
    kind: 'group';
    id: string;
    op: GroupOp;
    children: UiNode[];
}
export interface UiLeaf {
    kind: 'leaf';
    id: string;
    /** The wire node, verbatim. Unknown shapes travel through untouched. */
    node: CondNode;
}
export type UiNode = UiGroup | UiLeaf;
/** Identity for React keys and for the per-node test verdicts. */
export declare function nodeId(): string;
export declare function newGroup(op?: GroupOp, children?: UiNode[]): UiGroup;
export declare function newLeaf(node: CondNode): UiLeaf;
export declare function fromWire(node: CondNode | null | undefined): UiGroup;
export declare function toWire(node: UiNode): CondNode;
export declare function updateNode(root: UiGroup, id: string, fn: (n: UiNode) => UiNode): UiGroup;
export declare function removeNode(root: UiGroup, id: string): UiGroup;
export declare function addChild(root: UiGroup, parentId: string, child: UiNode): UiGroup;
/** Every node of the tree, depth-first. */
export declare function flatten(node: UiNode, out?: UiNode[]): UiNode[];
/** Depth of the WIRE tree, the root counting as 1 (`Condition::depth`). */
export declare function wireDepth(node: CondNode): number;
/** Number of comparisons in the whole tree (`Condition::leaves`). */
export declare function wireLeaves(node: CondNode): number;
/** Satisfied, not satisfied, or "this build cannot decide it here". */
export type Verdict = true | false | 'unknown';
export declare function verdictOf(node: UiNode, facts: Json): Verdict;
/** Verdict per node id, for painting the whole tree in one pass. */
export declare function verdictMap(root: UiNode, facts: Json): Record<string, Verdict>;
/** Is this leaf a plain comparison this build understands? */
export declare function asCompare(node: CondNode): CompareNode | null;
