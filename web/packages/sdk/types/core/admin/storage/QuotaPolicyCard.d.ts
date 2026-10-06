/**
 * Code-behind of `QuotaPolicyCard.kbview` (converted from `QuotaPolicyCard.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { OrgUnit } from "../../types";
import ConfirmDialog from "@ui/ConfirmDialog";
import { type QuotaUnit } from "./QuotaField";
import { type StorageOverview } from "./api";
import { ViewBase } from './QuotaPolicyCard.kbview';
import * as __parts from './QuotaPolicyCard.parts';
export type QuotaPolicyCardProps = {
    overview: StorageOverview;
};
export declare class QuotaPolicyCard extends ViewBase {
    accessor editing: {
        unitId: string | null;
        name: string;
    } | null;
    accessor picking: boolean;
    accessor amount: string;
    accessor unit: QuotaUnit;
    accessor error: string | null;
    tr: QuotaPolicyCardStores['t'];
    can: QuotaPolicyCardStores['can'];
    confirm: QuotaPolicyCardStores['confirm'];
    confirmState: QuotaPolicyCardStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    save: QuotaPolicyCardStores['save'];
    units: QuotaPolicyCardHooks['units'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../authz/types").CanFn;
        confirm: (options: import("@ui/ConfirmDialog").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        save: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            unitId: string | null;
            bytes: number | null;
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        units: NoInfer<OrgUnit[]> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get policy(): {
        key: string;
        instance_bytes: number | null;
        instance_locked: boolean;
        units: import("./api").UnitPolicy[];
    };
    get show_not_can_manage(): boolean;
    get span_text(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Lock aria-label>: an icon attribute without a property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Lock aria-label>: an icon attribute without a property). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `policy.units`. */
    get rows_units(): {
        u: import("./api").UnitPolicy;
        span_text: string;
        show_can_manage_u_unit: boolean;
        key: string;
    }[];
    get show_policy_units(): boolean;
    get show_error(): boolean;
    get show_editing(): boolean;
    /** `<QuotaField>`, rendered by a ReactHost. */
    get QuotaField(): import("react").FunctionComponent<Readonly<import("./QuotaField").QuotaFieldProps>>;
    get quota_field_props(): {
        label: string;
        amount: string;
        unit: "MiB" | "GiB" | "TiB";
        onAmount: (value: QuotaPolicyCard["amount"] | ((prev: QuotaPolicyCard["amount"]) => QuotaPolicyCard["amount"])) => void;
        onUnit: (value: QuotaUnit | ((prev: QuotaUnit) => QuotaUnit)) => void;
        autoFocus: boolean;
    };
    get enabled_unless_save_is_pending(): boolean;
    /** `<OrgUnitPicker>`, rendered by a ReactHost. */
    get OrgUnitPicker(): import("react").FunctionComponent<Readonly<import("../OrgUnitPicker").OrgUnitPickerProps>>;
    get org_unit_picker_props(): Readonly<import("../OrgUnitPicker").OrgUnitPickerProps>;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof ConfirmDialog;
    get confirm_dialog_props(): {
        onConfirm: () => void;
        onCancel: () => void;
        resolve: (ok: boolean) => void;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: import("@ui/ConfirmDialog").ConfirmVariant;
        hideCancel?: boolean;
    };
    openEditor(unitId: string | null, name: string, bytes: number | null): void;
    submit(): Promise<void>;
    revert(unitId: string, name: string): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, args: MouseEventArgs): undefined;
    button_click5(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click6(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setAmount` of the TSX: a value, or an update of the previous one. */
    setAmount(value: QuotaPolicyCard['amount'] | ((prev: QuotaPolicyCard['amount']) => QuotaPolicyCard['amount'])): void;
    /** `setUnit` of the TSX: a value, or an update of the previous one. */
    setUnit(value: QuotaUnit | ((prev: QuotaUnit) => QuotaUnit)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type QuotaPolicyCardStores = ReturnType<QuotaPolicyCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type QuotaPolicyCardHooks = ReturnType<QuotaPolicyCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<QuotaPolicyCardProps>>;
export default _default;
