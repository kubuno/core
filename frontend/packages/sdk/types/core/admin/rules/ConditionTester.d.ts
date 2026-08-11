import { type UiGroup, type Verdict } from './condition';
import { type LeafContext } from './leafKinds';
import type { TriggerRow } from './types';
interface Props {
    root: UiGroup;
    ctx: LeafContext;
    trigger: TriggerRow | undefined;
    /** Publishes the verdicts so the tree can paint itself. `null` clears them. */
    onVerdicts: (v: Record<string, Verdict> | null) => void;
}
export default function ConditionTester({ root, ctx, trigger, onVerdicts }: Props): import("react").JSX.Element;
export {};
