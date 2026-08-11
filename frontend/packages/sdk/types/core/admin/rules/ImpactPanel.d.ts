import { type BacktestRow } from './types';
interface Props {
    ruleId: string | null;
    /** The last replays already stored for this rule, newest first. */
    previous: BacktestRow[];
    /** No rule id yet (the wizard): the panel explains instead of offering. */
    hint?: string;
}
export default function ImpactPanel({ ruleId, previous, hint }: Props): import("react").JSX.Element;
export {};
