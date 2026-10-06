import type { ServicePicker } from './ServicePicker';
export declare function Part1({ toggleFold, group, open, t }: {
    toggleFold: ServicePicker['toggleFold'];
    group: NonNullable<ServicePicker['rows_groups']>[number]['group'];
    open: NonNullable<ServicePicker['rows_groups']>[number]['open'];
    t: NonNullable<ServicePicker['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ group, selected, toggle }: {
    group: NonNullable<ServicePicker['rows_groups']>[number]['group'];
    selected: NonNullable<ServicePicker['props']['selected']>;
    toggle: ServicePicker['toggle'];
}): import("react").JSX.Element;
