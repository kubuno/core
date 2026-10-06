/**
 * Code-behind of `ReauthDialog.kbview` (converted from `ReauthDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './ReauthDialog.kbview';
import * as __parts from './ReauthDialog.parts';
interface Challenge {
    methods: string[];
    token_ttl_seconds: number;
    grace_seconds: number;
    backup_codes_remaining: number;
}
interface Props {
    /** Called with the fresh proof; the API client replays the request with it. */
    onProof: (token: string) => void;
    onCancel: () => void;
}
export type { Props };
export declare class ReauthDialog extends ViewBase {
    accessor challenge: Challenge | null;
    accessor value: string;
    accessor error: string;
    accessor busy: boolean;
    tr: ReauthDialogStores['t'];
    inputRef: ReauthDialogStores['inputRef'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        inputRef: import("react").RefObject<HTMLInputElement | null>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {};
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get usesCode(): boolean;
    get noMethod(): boolean;
    get show_not_no_method(): boolean;
    get part1_props(): {
        inputRef: import("react").RefObject<HTMLInputElement | null>;
        usesCode: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        value: string;
        setValue: (value: ReauthDialog["value"] | ((prev: ReauthDialog["value"]) => ReauthDialog["value"])) => void;
    };
    /** A part of the screen still written in React (<TextField> ref: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get backup_hint_count(): number;
    get show_error(): boolean;
    get enabled_unless_busy_no_method_value(): boolean;
    submit(e: React.FormEvent): Promise<void>;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    /** `setValue` of the TSX: a value, or an update of the previous one. */
    setValue(value: ReauthDialog['value'] | ((prev: ReauthDialog['value']) => ReauthDialog['value'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ReauthDialogStores = ReturnType<ReauthDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ReauthDialogHooks = ReturnType<ReauthDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
