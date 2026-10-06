/**
 * Code-behind of `CheckboxRow.kbview` (converted from `CheckboxRow.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs } from '@kubuno/views';
import { type RowProps } from "./PolicyRow";
import { ViewBase } from './CheckboxRow.kbview';
export type CheckboxRowProps = RowProps & {
    /** Marks a field carrying personal data (`gender`, `birthday`). */
    personal?: boolean;
};
export declare class CheckboxRow extends ViewBase {
    row: CheckboxRowHooks['row'];
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        row: {
            t: import("i18next").TFunction<"translation", undefined>;
            label: string;
            desc: string;
            disabled: boolean;
        } | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get checked(): boolean;
    get enabled_unless_row_disabled(): boolean;
    get text(): string;
    get description(): string;
    get show_personal(): boolean;
    get span_text(): string;
    /** `<ProvenanceLine>`, rendered by a ReactHost. */
    get ProvenanceLine(): import("react").FunctionComponent<Readonly<import("../../settings/ProvenanceLine").ProvenanceLineProps>>;
    get provenance_line_props(): Readonly<import("../../settings/ProvenanceLine").ProvenanceLineProps>;
    check_box_checked_changed(_sender: unknown, args: ValueChangedEventArgs): undefined;
}
/** What `useHooks()` gives (the types of the fields it fills). */
export type CheckboxRowHooks = ReturnType<CheckboxRow['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<CheckboxRowProps>>;
export default _default;
