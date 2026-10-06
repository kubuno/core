import type { OrgUnitScopePanel } from './OrgUnitScopePanel';
export declare function Part1({ rows, matching, expanded, selected, pick, toggle, multi, counts }: {
    rows: NonNullable<OrgUnitScopePanel['rows']>;
    matching: OrgUnitScopePanel['matching'];
    expanded: NonNullable<OrgUnitScopePanel['expanded']>;
    selected: NonNullable<OrgUnitScopePanel['selected']>;
    pick: OrgUnitScopePanel['pick'];
    toggle: OrgUnitScopePanel['toggle'];
    multi: NonNullable<OrgUnitScopePanel['multi']>;
    counts: NonNullable<OrgUnitScopePanel['props']['counts']>;
}): import("react").JSX.Element;
export declare function Part2({ value, onChange, t }: {
    value: NonNullable<OrgUnitScopePanel['props']['value']>;
    onChange: NonNullable<OrgUnitScopePanel['props']['onChange']>;
    t: NonNullable<OrgUnitScopePanel['tr']>;
}): import("react").JSX.Element;
