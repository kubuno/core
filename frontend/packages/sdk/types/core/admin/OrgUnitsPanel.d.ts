import { type MenuItem, type MenuDropdownPos } from "@ui";
import type { OrgUnit } from "../types";
import { ViewBase } from './OrgUnitsPanel.kbview';
import * as __parts from './OrgUnitsPanel.parts';
export declare class OrgUnitsPanel extends ViewBase {
    accessor dialog: {
        mode: 'create' | 'edit';
        unit?: OrgUnit;
        parentId?: string;
    } | null;
    accessor moveUnit: OrgUnit | null;
    accessor menu: {
        unit: OrgUnit;
        pos: MenuDropdownPos;
    } | null;
    accessor pendingCreate: boolean;
    tr: OrgUnitsPanelStores['t'];
    qc: OrgUnitsPanelStores['qc'];
    can: OrgUnitsPanelStores['can'];
    data: OrgUnitsPanelStores['data'];
    counts: OrgUnitsPanelStores['counts'];
    params: URLSearchParams;
    toast: OrgUnitsPanelStores['toast'];
    confirm: OrgUnitsPanelStores['confirm'];
    confirmState: OrgUnitsPanelStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    move: OrgUnitsPanelHooks['move'];
    remove: OrgUnitsPanelHooks['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        can: import("../authz/types").CanFn;
        data: NoInfer<OrgUnit[]> | undefined;
        counts: NoInfer<{
            org_unit_id: string;
            count: number;
        }[]> | undefined;
        params: URLSearchParams;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        move: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, {
            id: string;
            parent_id: string;
        }, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get units(): NoInfer<OrgUnit[]>;
    get own(): Map<string, number>;
    get search(): string;
    get needle(): string;
    get flat(): {
        u: OrgUnit;
        depth: number;
    }[];
    get rows(): {
        u: OrgUnit;
        depth: number;
    }[];
    get span_text(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../authz/types").CanFn;
        rows: {
            u: OrgUnit;
            depth: number;
        }[];
        own: Map<string, number>;
        subtreeCount: (id: string, depth?: number) => number;
        setDialog: (value: {
            mode: "create" | "edit";
            unit?: OrgUnit;
            parentId?: string;
        } | null | ((prev: {
            mode: "create" | "edit";
            unit?: OrgUnit;
            parentId?: string;
        } | null) => {
            mode: "create" | "edit";
            unit?: OrgUnit;
            parentId?: string;
        } | null)) => void;
        setMoveUnit: (value: OrgUnit | null | ((prev: OrgUnit | null) => OrgUnit | null)) => void;
        openMenu: (u: OrgUnit, el: HTMLElement) => void;
    };
    /** A part of the screen still written in React (<table> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get show_menu(): boolean;
    get part2_props(): {
        menuItems: (u: OrgUnit) => MenuItem[];
        menu: {
            unit: OrgUnit;
            pos: MenuDropdownPos;
        };
        setMenu: (value: {
            unit: OrgUnit;
            pos: MenuDropdownPos;
        } | null | ((prev: {
            unit: OrgUnit;
            pos: MenuDropdownPos;
        } | null) => {
            unit: OrgUnit;
            pos: MenuDropdownPos;
        } | null)) => void;
    };
    /** A part of the screen still written in React (<ContextMenu> pos, onClose: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get show_dialog(): boolean;
    /** `<OrgUnitDialog>`, rendered by a ReactHost. */
    get OrgUnitDialog(): typeof __parts.OrgUnitDialog;
    get org_unit_dialog_props(): {
        mode: "create" | "edit";
        unit?: OrgUnit;
        parentId?: string;
        units: OrgUnit[];
        onClose: () => void;
    };
    get show_move_unit(): boolean;
    /** `<OrgUnitPicker>`, rendered by a ReactHost. */
    get OrgUnitPicker(): import("react").FunctionComponent<Readonly<import("./OrgUnitPicker").OrgUnitPickerProps>>;
    get org_unit_picker_props(): Readonly<import("./OrgUnitPicker").OrgUnitPickerProps>;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof import("../../ui/ConfirmDialog").default;
    get confirm_dialog_props(): {
        onConfirm: () => void;
        onCancel: () => void;
        resolve: (ok: boolean) => void;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: import("@ui").ConfirmVariant;
        hideCancel?: boolean;
    };
    subtreeCount(id: string, depth?: number): number;
    invalidate_(): void;
    askDelete(u: OrgUnit): Promise<void>;
    openMenu(u: OrgUnit, el: HTMLElement): void;
    menuItems(u: OrgUnit): MenuItem[];
    /** `setDialog` of the TSX: a value, or an update of the previous one. */
    setDialog(value: {
        mode: 'create' | 'edit';
        unit?: OrgUnit;
        parentId?: string;
    } | null | ((prev: {
        mode: 'create' | 'edit';
        unit?: OrgUnit;
        parentId?: string;
    } | null) => {
        mode: 'create' | 'edit';
        unit?: OrgUnit;
        parentId?: string;
    } | null)): void;
    /** `setMoveUnit` of the TSX: a value, or an update of the previous one. */
    setMoveUnit(value: OrgUnit | null | ((prev: OrgUnit | null) => OrgUnit | null)): void;
    /** `setMenu` of the TSX: a value, or an update of the previous one. */
    setMenu(value: {
        unit: OrgUnit;
        pos: MenuDropdownPos;
    } | null | ((prev: {
        unit: OrgUnit;
        pos: MenuDropdownPos;
    } | null) => {
        unit: OrgUnit;
        pos: MenuDropdownPos;
    } | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OrgUnitsPanelStores = ReturnType<OrgUnitsPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type OrgUnitsPanelHooks = ReturnType<OrgUnitsPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
