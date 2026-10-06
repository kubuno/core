/**
 * Code-behind of `CalendarDialog.kbview` (converted from `CalendarDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './CalendarDialog.kbview';
import * as __parts from './CalendarDialog.parts';
export type CalendarDialogProps = {
    onClose: () => void;
    onCreated: (id: string) => void;
};
export declare class CalendarDialog extends ViewBase {
    accessor name: string;
    accessor country: string;
    accessor error: string | null;
    tr: CalendarDialogStores['t'];
    create: CalendarDialogStores['create'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        create: import("@tanstack/react-query").UseMutationResult<{
            id: string;
            code: string;
        }, Error, {
            name: string;
            code?: string;
            country_code?: string;
        }, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get enabled_unless_create_is_pending_name(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        setName: (value: CalendarDialog["name"] | ((prev: CalendarDialog["name"]) => CalendarDialog["name"])) => void;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_error(): boolean;
    submit(): Promise<void>;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
    /** `setName` of the TSX: a value, or an update of the previous one. */
    setName(value: CalendarDialog['name'] | ((prev: CalendarDialog['name']) => CalendarDialog['name'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CalendarDialogStores = ReturnType<CalendarDialog['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<CalendarDialogProps>>;
export default _default;
