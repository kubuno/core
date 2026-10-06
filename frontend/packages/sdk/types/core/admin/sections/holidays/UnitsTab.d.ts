/**
 * Code-behind of `UnitsTab.kbview` (converted from `UnitsTab.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './UnitsTab.kbview';
import * as __parts from './UnitsTab.parts';
export type UnitsTabProps = {
    canManage: boolean;
};
export declare class UnitsTab extends ViewBase {
    accessor unitId: string | null;
    accessor picking: boolean;
    accessor adding: string;
    accessor error: string | null;
    tr: UnitsTabStores['t'];
    units: UnitsTabStores['units'];
    calendars: UnitsTabStores['calendars'];
    prefs: UnitsTabHooks['prefs'];
    isLoading: boolean;
    setPref: UnitsTabHooks['setPref'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        units: NoInfer<{
            id: string;
            name: string;
        }[]> | undefined;
        calendars: NoInfer<import("./api").CalendarSummary[]> | undefined;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        prefs: NoInfer<import("./api").UnitPref[]> | undefined;
        isLoading: boolean;
        setPref: import("@tanstack/react-query").UseMutationResult<any, Error, {
            calendar_id?: string;
            holiday_id?: string;
            enabled: boolean | null;
        }, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get unitName(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        setPicking: (value: UnitsTab["picking"] | ((prev: UnitsTab["picking"]) => UnitsTab["picking"])) => void;
        unitName: string;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part2(): typeof __parts.Part2;
    get show_unit_id_can_manage(): boolean;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        adding: string;
        t: import("i18next").TFunction<"translation", undefined>;
        calendars: NoInfer<import("./api").CalendarSummary[]> | undefined;
        setAdding: (value: UnitsTab["adding"] | ((prev: UnitsTab["adding"]) => UnitsTab["adding"])) => void;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get part5_props(): {
        adding: string;
        setPref: import("@tanstack/react-query").UseMutationResult<any, Error, {
            calendar_id?: string;
            holiday_id?: string;
            enabled: boolean | null;
        }, unknown>;
        setError: (value: string | null | ((prev: string | null) => string | null)) => void;
        setAdding: (value: UnitsTab["adding"] | ((prev: UnitsTab["adding"]) => UnitsTab["adding"])) => void;
        fail: (e: unknown) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part5(): typeof __parts.Part5;
    get show_error(): boolean;
    get show_unit_id(): boolean;
    get show_not_unit_id(): boolean;
    get show_not_is_loading(): boolean;
    get show_prefs(): boolean;
    get show_not_prefs(): boolean;
    get enabled_unless_can_manage_set_pref_is_pending(): boolean;
    /** A part of the screen still written in React (<Button> with element children). */
    get Part6(): typeof __parts.Part6;
    /** The rows of the Repeater over `(prefs ?? [])`. */
    get rows_items(): {
        pref: import("./api").UnitPref;
        span_text: string | undefined;
        part6_props: {
            t: import("i18next").TFunction<"translation", undefined>;
            setError: (value: string | null | ((prev: string | null) => string | null)) => void;
            setPref: import("@tanstack/react-query").UseMutationResult<any, Error, {
                calendar_id?: string;
                holiday_id?: string;
                enabled: boolean | null;
            }, unknown>;
            pref: import("./api").UnitPref;
            fail: (e: unknown) => void;
        } | undefined;
        key: string;
    }[];
    get visible(): boolean;
    get visible2(): boolean;
    get visible3(): boolean;
    get visible4(): boolean;
    get visible5(): boolean;
    /** `<OrgUnitPicker>`, rendered by a ReactHost. */
    get OrgUnitPicker(): import("react").FunctionComponent<Readonly<import("../../OrgUnitPicker").OrgUnitPickerProps>>;
    get org_unit_picker_props(): Readonly<import("../../OrgUnitPicker").OrgUnitPickerProps>;
    fail(e: unknown): void;
    switch_checked_changed(_sender: unknown, args: EventArgs): undefined;
    /** `setPicking` of the TSX: a value, or an update of the previous one. */
    setPicking(value: UnitsTab['picking'] | ((prev: UnitsTab['picking']) => UnitsTab['picking'])): void;
    /** `setAdding` of the TSX: a value, or an update of the previous one. */
    setAdding(value: UnitsTab['adding'] | ((prev: UnitsTab['adding']) => UnitsTab['adding'])): void;
    /** `setError` of the TSX: a value, or an update of the previous one. */
    setError(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type UnitsTabStores = ReturnType<UnitsTab['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type UnitsTabHooks = ReturnType<UnitsTab['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<UnitsTabProps>>;
export default _default;
