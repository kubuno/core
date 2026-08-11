import type { Mode } from './types';
interface Props {
    value: Mode;
    onChange: (mode: Mode) => void;
    /** Modes the catalogue says are settable. Anything else is not offered. */
    modes: Mode[];
    /** `enforce` needs at least one action — the server refuses it otherwise. */
    hasActions: boolean;
    disabled?: boolean;
}
export default function ModePicker({ value, onChange, modes, hasActions, disabled }: Props): import("react").JSX.Element;
export {};
