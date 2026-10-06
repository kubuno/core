import type { ScopeTree } from './ScopeTree';
export declare function Part1({ needle, setNeedle, t }: {
    needle: NonNullable<ScopeTree['needle']>;
    setNeedle: NonNullable<ScopeTree['setNeedle']>;
    t: NonNullable<ScopeTree['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ rows, scope, isOpen, toggle, onChange, rowClass, overriding, t }: {
    rows: NonNullable<ScopeTree['rows']>;
    scope: NonNullable<ScopeTree['props']['scope']>;
    isOpen: ScopeTree['isOpen'];
    toggle: ScopeTree['toggle'];
    onChange: NonNullable<ScopeTree['props']['onChange']>;
    rowClass: ScopeTree['rowClass'];
    overriding: ScopeTree['props']['overriding'];
    t: NonNullable<ScopeTree['tr']>;
}): import("react").JSX.Element;
