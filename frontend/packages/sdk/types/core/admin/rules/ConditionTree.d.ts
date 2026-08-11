import { type UiGroup, type Verdict } from './condition';
import { type LeafContext } from './leafKinds';
import type { RuleLimits } from './types';
interface Props {
    root: UiGroup;
    onChange: (next: UiGroup) => void;
    ctx: LeafContext;
    limits: RuleLimits;
    /** Verdicts of the last test run, by node id. Absent ⇒ no test has run. */
    verdicts?: Record<string, Verdict>;
    disabled?: boolean;
}
export default function ConditionTree({ root, onChange, ctx, limits, verdicts, disabled }: Props): import("react").JSX.Element;
export {};
