import type { Scope } from './types';
import type { Directory } from './useDirectory';
interface Props {
    value: Scope;
    onChange: (next: Scope) => void;
    dir: Directory;
    maxRefs: number;
    disabled?: boolean;
}
export default function ScopeEditor({ value, onChange, dir, maxRefs, disabled }: Props): import("react").JSX.Element;
export {};
