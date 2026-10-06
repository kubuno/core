import type { AuthMethodsPanel } from './AuthMethodsPanel';
type MethodId = 'local' | 'directory' | 'sso';
declare function MethodRow({ id, icon, checked, disabled, onChange, t, }: {
    id: MethodId;
    icon: React.ReactNode;
    checked: boolean;
    disabled: boolean;
    onChange: (v: boolean) => void;
    t: (k: string) => string;
}): import("react").JSX.Element;
export { MethodRow };
export declare function Part1({ t }: {
    t: NonNullable<AuthMethodsPanel['tr']>;
}): import("react").JSX.Element;
