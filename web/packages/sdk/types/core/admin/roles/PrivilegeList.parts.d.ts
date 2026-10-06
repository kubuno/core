import type { Privilege } from "../../authz/types";
import type { PrivilegeList } from './PrivilegeList';
declare function Flags({ priv }: {
    priv: Privilege;
}): import("react").JSX.Element;
export { Flags };
export declare function Part1({ g, privilegeLabel, editing, onToggle, pad, selected }: {
    g: NonNullable<PrivilegeList['rows_groups']>[number]['g'];
    privilegeLabel: NonNullable<PrivilegeList['privilegeLabel']>;
    editing: NonNullable<PrivilegeList['editing']>;
    onToggle: NonNullable<PrivilegeList['props']['onToggle']>;
    pad: NonNullable<PrivilegeList['pad']>;
    selected: NonNullable<PrivilegeList['props']['selected']>;
}): import("react").JSX.Element;
