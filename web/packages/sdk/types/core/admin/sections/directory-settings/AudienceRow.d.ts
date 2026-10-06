/**
 * Code-behind of `AudienceRow.kbview` (converted from `AudienceRow.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs } from '@kubuno/views';
import { type RowProps } from "./PolicyRow";
import { ViewBase } from './AudienceRow.kbview';
export type { RowProps };
export declare class AudienceRow extends ViewBase {
    tr: AudienceRowStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get current(): string;
    get disabled(): boolean;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get enabled_unless_disabled(): boolean;
    /** The rows of the Repeater over `AUDIENCE_OPTIONS`. */
    get rows_audience_options(): {
        option: "all_members" | "same_unit";
        selected_value: boolean | undefined;
        text: string | undefined;
        description: string | undefined;
        key: "all_members" | "same_unit";
    }[];
    /** `<ProvenanceLine>`, rendered by a ReactHost. */
    get ProvenanceLine(): import("react").FunctionComponent<Readonly<import("../../settings/ProvenanceLine").ProvenanceLineProps>>;
    get provenance_line_props(): Readonly<import("../../settings/ProvenanceLine").ProvenanceLineProps>;
    radio_button_checked_changed(_sender: unknown, args: ValueChangedEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AudienceRowStores = ReturnType<AudienceRow['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<RowProps>>;
export default _default;
