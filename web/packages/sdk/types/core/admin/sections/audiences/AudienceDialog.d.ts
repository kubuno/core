/**
 * Code-behind of `AudienceDialog.kbview` (converted from `AudienceDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './AudienceDialog.kbview';
import * as __parts from './AudienceDialog.parts';
export type AudienceDialogProps = {
    busy: boolean;
    error?: string;
    onSave: (v: {
        name: string;
        description: string | null;
    }) => void;
    onCancel: () => void;
};
export declare class AudienceDialog extends ViewBase {
    accessor name: string;
    accessor desc: string;
    tr: AudienceDialogStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get nameLen(): number;
    get descLen(): number;
    get canSave(): boolean;
    get enabled_unless_can_save(): boolean;
    get enabled_unless_busy(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        setName: (value: AudienceDialog["name"] | ((prev: AudienceDialog["name"]) => AudienceDialog["name"])) => void;
        nameLen: number;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get error_text(): string | undefined;
    get aud_desc_hint_max(): number;
    get show_error(): boolean;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    /** `setName` of the TSX: a value, or an update of the previous one. */
    setName(value: AudienceDialog['name'] | ((prev: AudienceDialog['name']) => AudienceDialog['name'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AudienceDialogStores = ReturnType<AudienceDialog['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AudienceDialogProps>>;
export default _default;
