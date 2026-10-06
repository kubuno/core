import type { ApiTokenScopePicker } from './ApiTokenScopePicker';
export declare function Part1({ chosen, toggle, scopes, privilegeLabel, t }: {
    chosen: NonNullable<ApiTokenScopePicker['chosen']>;
    toggle: ApiTokenScopePicker['toggle'];
    scopes: NonNullable<ApiTokenScopePicker['props']['scopes']>;
    privilegeLabel: NonNullable<ApiTokenScopePicker['privilegeLabel']>;
    t: NonNullable<ApiTokenScopePicker['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ groups, chosen, collapsed, setCollapsed, domainLabel, toggleGroup, t, toggle, privilegeLabel, privilegeDescription }: {
    groups: NonNullable<ApiTokenScopePicker['groups']>;
    chosen: NonNullable<ApiTokenScopePicker['chosen']>;
    collapsed: NonNullable<ApiTokenScopePicker['collapsed']>;
    setCollapsed: NonNullable<ApiTokenScopePicker['setCollapsed']>;
    domainLabel: NonNullable<ApiTokenScopePicker['domainLabel']>;
    toggleGroup: ApiTokenScopePicker['toggleGroup'];
    t: NonNullable<ApiTokenScopePicker['tr']>;
    toggle: ApiTokenScopePicker['toggle'];
    privilegeLabel: NonNullable<ApiTokenScopePicker['privilegeLabel']>;
    privilegeDescription: NonNullable<ApiTokenScopePicker['privilegeDescription']>;
}): import("react").JSX.Element;
