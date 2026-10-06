/**
 * Code-behind of `FloorsField.kbview` (converted from `FloorsField.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './FloorsField.kbview';
import * as __parts from './FloorsField.parts';
export type FloorsFieldProps = {
    floors: string[];
    onChange: (next: string[]) => void;
    /** Column width of a floor name, served by the API alongside the list. */
    maxLength: number;
    /** How many floors a building may hold at all, served by the API. */
    maxFloors: number;
    disabled?: boolean;
};
export declare class FloorsField extends ViewBase {
    tr: FloorsFieldStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (./FieldLabel#default)). */
    get Part1(): typeof __parts.Part1;
    get enabled_unless_disabled(): boolean;
    /** The rows of the Repeater over `floors`. */
    get rows_floors(): {
        floor: string;
        index: number;
        res_floor_rank_rank: number;
        enabled_unless_disabled_index: boolean;
        enabled_unless_disabled_index_floors: boolean;
        key: number;
    }[];
    get enabled_unless_disabled_floors_max_floors(): boolean;
    set(index: number, value: string): void;
    move(index: number, delta: number): void;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
    panel_click2(_sender: unknown, args: MouseEventArgs): void;
    panel_click3(_sender: unknown, args: MouseEventArgs): void;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type FloorsFieldStores = ReturnType<FloorsField['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<FloorsFieldProps>>;
export default _default;
