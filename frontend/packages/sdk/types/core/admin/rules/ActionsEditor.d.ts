import type { ActionRow, ActionSpec } from './types';
interface Props {
    value: ActionSpec[];
    onChange: (next: ActionSpec[]) => void;
    catalogue: ActionRow[];
    maxActions: number;
    disabled?: boolean;
}
export default function ActionsEditor({ value, onChange, catalogue, maxActions, disabled }: Props): import("react").JSX.Element;
export {};
