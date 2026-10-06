import type { OrgUnitPicker } from './OrgUnitPicker';
export declare function Part1({ needle, setNeedle, t }: {
    needle: NonNullable<OrgUnitPicker['needle']>;
    setNeedle: NonNullable<OrgUnitPicker['setNeedle']>;
    t: NonNullable<OrgUnitPicker['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ treeRef, title, onTreeKey, visible, renderRow }: {
    treeRef: NonNullable<OrgUnitPicker['treeRef']>;
    title: NonNullable<OrgUnitPicker['props']['title']>;
    onTreeKey: OrgUnitPicker['onTreeKey'];
    visible: NonNullable<OrgUnitPicker['visible']>;
    renderRow: OrgUnitPicker['renderRow'];
}): import("react").JSX.Element;
