import type { OrgUnit } from "../types";
import type { OrgUnitsPanel } from './OrgUnitsPanel';
declare function OrgUnitDialog({ mode, unit, parentId, units, onClose, }: {
    mode: 'create' | 'edit';
    unit?: OrgUnit;
    parentId?: string;
    units: OrgUnit[];
    onClose: () => void;
}): import("react").JSX.Element;
export { OrgUnitDialog };
export declare function Part1({ t, can, rows, own, subtreeCount, setDialog, setMoveUnit, openMenu }: {
    t: NonNullable<OrgUnitsPanel['tr']>;
    can: NonNullable<OrgUnitsPanel['can']>;
    rows: NonNullable<OrgUnitsPanel['rows']>;
    own: NonNullable<OrgUnitsPanel['own']>;
    subtreeCount: OrgUnitsPanel['subtreeCount'];
    setDialog: NonNullable<OrgUnitsPanel['setDialog']>;
    setMoveUnit: NonNullable<OrgUnitsPanel['setMoveUnit']>;
    openMenu: OrgUnitsPanel['openMenu'];
}): import("react").JSX.Element;
export declare function Part2({ menuItems, menu, setMenu }: {
    menuItems: OrgUnitsPanel['menuItems'];
    menu: NonNullable<OrgUnitsPanel['menu']>;
    setMenu: NonNullable<OrgUnitsPanel['setMenu']>;
}): import("react").JSX.Element;
