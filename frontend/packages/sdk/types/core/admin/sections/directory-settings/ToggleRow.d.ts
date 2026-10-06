/**
 * Code-behind of `ToggleRow.kbview` (converted from `ToggleRow.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { type RowProps } from "./PolicyRow";
import { ViewBase } from './ToggleRow.kbview';
export type { RowProps };
export declare class ToggleRow extends ViewBase {
    row: ToggleRowHooks['row'];
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
    get on(): boolean;
    get enabled_unless_row_disabled(): boolean;
    get label(): string;
    get description(): string;
    /** `<ProvenanceLine>`, rendered by a ReactHost. */
    get ProvenanceLine(): import("react").FunctionComponent<Readonly<import("../../settings/ProvenanceLine").ProvenanceLineProps>>;
    get provenance_line_props(): Readonly<import("../../settings/ProvenanceLine").ProvenanceLineProps>;
    switch_checked_changed(_sender: unknown, args: EventArgs): undefined;
}
/** What `useHooks()` gives (the types of the fields it fills). */
export type ToggleRowHooks = ReturnType<ToggleRow['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<RowProps>>;
export default _default;
