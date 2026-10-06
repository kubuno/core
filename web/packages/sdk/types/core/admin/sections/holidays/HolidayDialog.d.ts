/**
 * Code-behind of `HolidayDialog.kbview` (converted from `HolidayDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { type Category, type Holiday, type HolidayInput, type Observance, type PreviewDate, type RuleKind, type RuleParams } from "./api";
import { ViewBase } from './HolidayDialog.kbview';
import * as __parts from './HolidayDialog.parts';
export type HolidayDialogProps = {
    calendarId: string;
    /** `null` creates. */
    holiday: Holiday | null;
    onClose: () => void;
};
export declare class HolidayDialog extends ViewBase {
    accessor error: string | null;
    accessor preview: PreviewDate[];
    tr: HolidayDialogStores['t'];
    i18n: HolidayDialogStores['i18n'];
    name: HolidayDialogHooks['name'];
    setName: HolidayDialogHooks['setName'];
    category: Category;
    setCategory: HolidayDialogHooks['setCategory'];
    kind: RuleKind;
    setKind: HolidayDialogHooks['setKind'];
    rule: RuleParams;
    setRule: HolidayDialogHooks['setRule'];
    observance: Observance;
    setObservance: HolidayDialogHooks['setObservance'];
    fromYear: string;
    setFromYear: HolidayDialogHooks['setFromYear'];
    toYear: string;
    setToYear: HolidayDialogHooks['setToYear'];
    datesText: HolidayDialogHooks['datesText'];
    setDatesText: HolidayDialogHooks['setDatesText'];
    create: HolidayDialogHooks['create'];
    update: HolidayDialogStores['update'];
    runPreview: HolidayDialogStores['runPreview'];
    composed: RuleParams;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        update: import("@tanstack/react-query").UseMutationResult<any, Error, {
            id: string;
            input: HolidayInput;
        }, unknown>;
        runPreview: import("@tanstack/react-query").UseMutationResult<PreviewDate[], Error, {
            kind: RuleKind;
            rule: RuleParams;
            observance: Observance;
            years?: number[];
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        name: string;
        setName: import("react").Dispatch<import("react").SetStateAction<string>>;
        category: Category;
        setCategory: import("react").Dispatch<import("react").SetStateAction<Category>>;
        kind: RuleKind;
        setKind: import("react").Dispatch<import("react").SetStateAction<RuleKind>>;
        rule: RuleParams;
        setRule: import("react").Dispatch<import("react").SetStateAction<RuleParams>>;
        observance: Observance;
        setObservance: import("react").Dispatch<import("react").SetStateAction<Observance>>;
        fromYear: string;
        setFromYear: import("react").Dispatch<import("react").SetStateAction<string>>;
        toYear: string;
        setToYear: import("react").Dispatch<import("react").SetStateAction<string>>;
        datesText: string;
        setDatesText: import("react").Dispatch<import("react").SetStateAction<string>>;
        create: import("@tanstack/react-query").UseMutationResult<any, Error, HolidayInput, unknown>;
        composed: RuleParams;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get locale(): string;
    get busy(): boolean;
    get months(): {
        value: string;
        label: string;
    }[];
    get weekdays(): {
        value: string;
        label: string;
    }[];
    get enabled_unless_busy_name_trim(): boolean;
    get title(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        setName: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        category: Category;
        t: import("i18next").TFunction<"translation", undefined>;
        setCategory: import("react").Dispatch<import("react").SetStateAction<Category>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part4(): typeof __parts.Part4;
    get part5_props(): {
        kind: RuleKind;
        t: import("i18next").TFunction<"translation", undefined>;
        setKind: import("react").Dispatch<import("react").SetStateAction<RuleKind>>;
        setRule: import("react").Dispatch<import("react").SetStateAction<RuleParams>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part5(): typeof __parts.Part5;
    get show_kind_fixed(): boolean;
    get part6_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part6(): typeof __parts.Part6;
    get part7_props(): {
        rule: RuleParams;
        months: {
            value: string;
            label: string;
        }[];
        setRule: import("react").Dispatch<import("react").SetStateAction<RuleParams>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part7(): typeof __parts.Part7;
    get value(): number;
    get show_kind_easter(): boolean;
    get value2(): number;
    get minimum(): number;
    get part8_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part8(): typeof __parts.Part8;
    get part9_props(): {
        rule: RuleParams;
        t: import("i18next").TFunction<"translation", undefined>;
        setRule: import("react").Dispatch<import("react").SetStateAction<RuleParams>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part9(): typeof __parts.Part9;
    get show_kind_nth_weekday(): boolean;
    get part10_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part10(): typeof __parts.Part10;
    get part11_props(): {
        rule: RuleParams;
        t: import("i18next").TFunction<"translation", undefined>;
        setRule: import("react").Dispatch<import("react").SetStateAction<RuleParams>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part11(): typeof __parts.Part11;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part12(): typeof __parts.Part12;
    get part13_props(): {
        rule: RuleParams;
        weekdays: {
            value: string;
            label: string;
        }[];
        setRule: import("react").Dispatch<import("react").SetStateAction<RuleParams>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part13(): typeof __parts.Part13;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part14(): typeof __parts.Part14;
    get part15_props(): {
        rule: RuleParams;
        months: {
            value: string;
            label: string;
        }[];
        setRule: import("react").Dispatch<import("react").SetStateAction<RuleParams>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part15(): typeof __parts.Part15;
    get show_kind_dates(): boolean;
    get part16_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part16(): typeof __parts.Part16;
    get part17_props(): {
        datesText: string;
        setDatesText: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<textarea> has no .kbview element yet). */
    get Part17(): typeof __parts.Part17;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part18(): typeof __parts.Part18;
    get part19_props(): {
        observance: Observance;
        t: import("i18next").TFunction<"translation", undefined>;
        setObservance: import("react").Dispatch<import("react").SetStateAction<Observance>>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part19(): typeof __parts.Part19;
    get part20_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        fromYear: string;
        setFromYear: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> inputMode: no .kbview property). */
    get Part20(): typeof __parts.Part20;
    get part21_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toYear: string;
        setToYear: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    /** A part of the screen still written in React (<TextField> inputMode: no .kbview property). */
    get Part21(): typeof __parts.Part21;
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../resources/FieldLabel#default)). */
    get Part22(): typeof __parts.Part22;
    get show_preview(): boolean;
    get show_not_preview(): boolean;
    /** The rows of the Repeater over `preview`. */
    get rows_preview(): {
        d: PreviewDate;
        text: string | undefined;
        show_d_observed_from: boolean | undefined;
        span_text: string | undefined;
        key: string;
    }[];
    get show_holiday_is_builtin(): boolean;
    get show_error(): boolean;
    submit(): Promise<void>;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    numeric_field_value_changed(_sender: unknown, args: ValueChangedEventArgs): undefined;
    numeric_field_value_changed2(_sender: unknown, args: ValueChangedEventArgs): undefined;
    /** `setPreview` of the TSX: a value, or an update of the previous one. */
    setPreview(value: PreviewDate[] | ((prev: PreviewDate[]) => PreviewDate[])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type HolidayDialogStores = ReturnType<HolidayDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type HolidayDialogHooks = ReturnType<HolidayDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<HolidayDialogProps>>;
export default _default;
