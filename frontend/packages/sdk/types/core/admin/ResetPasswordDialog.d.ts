/**
 * Code-behind of `ResetPasswordDialog.kbview` (converted from `ResetPasswordDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { ViewBase } from './ResetPasswordDialog.kbview';
import * as __parts from './ResetPasswordDialog.parts';
export interface ResetPasswordDialogProps {
    userId: string;
    /** Display name or username — shown in the dialog subtitle. */
    userLabel: string;
    /** Account address, used as the placeholder of the "send to" field. */
    userEmail?: string;
    onClose: () => void;
    /** Called after a successful reset, for the caller to refresh its data. */
    onDone?: () => void;
}
interface ResetResponse {
    ok: boolean;
    password: string | null;
    generated: boolean;
    must_change: boolean;
    sessions_revoked: number;
    email: {
        requested: boolean;
        queued?: boolean;
        to?: string;
        reason?: string;
    };
}
export declare class ResetPasswordDialog extends ViewBase {
    accessor mode: 'generate' | 'manual';
    accessor password: string;
    accessor requireChange: boolean;
    accessor sendEmail: boolean;
    accessor emailTo: string;
    accessor error: string | null;
    accessor outcome: ResetResponse | null;
    accessor revealed: boolean;
    accessor copied: boolean;
    tr: ResetPasswordDialogStores['t'];
    reset: ResetPasswordDialogHooks['reset'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        reset: import("@tanstack/react-query").UseMutationResult<ResetResponse, unknown, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get sessions(): number;
    get show_case_1(): boolean;
    get show_outcome_password(): boolean;
    get show_not_outcome_password(): boolean;
    get code_text(): string;
    get show_not_revealed(): boolean;
    get accessible_name(): string;
    get show_not_copied(): boolean;
    get li_text(): string;
    get show_outcome_must_change(): boolean;
    get show_outcome_email_requested(): boolean;
    get show_outcome_email_queued(): boolean;
    get show_not_outcome_email_queued(): boolean;
    get email_queued_to(): string | undefined;
    get visible(): boolean;
    get visible2(): boolean;
    get show_main(): boolean;
    get selected_value(): boolean;
    get selected_value2(): boolean;
    get part1_props(): {
        password: string;
        setPassword: (value: ResetPasswordDialog["password"] | ((prev: ResetPasswordDialog["password"]) => ResetPasswordDialog["password"])) => void;
        setError: (value: string | null | ((prev: string | null) => string | null)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get placeholder(): string;
    get show_error(): boolean;
    submit(): void;
    copy(): void;
    floating_window_close(_sender: unknown, _args: EventArgs): undefined;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    floating_window_close2(_sender: unknown, _args: EventArgs): undefined;
    radio_button_checked_changed(_sender: unknown, _args: ValueChangedEventArgs): undefined;
    radio_button_checked_changed2(_sender: unknown, _args: ValueChangedEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setPassword` of the TSX: a value, or an update of the previous one. */
    setPassword(value: ResetPasswordDialog['password'] | ((prev: ResetPasswordDialog['password']) => ResetPasswordDialog['password'])): void;
    /** `setError` of the TSX: a value, or an update of the previous one. */
    setError(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ResetPasswordDialogStores = ReturnType<ResetPasswordDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ResetPasswordDialogHooks = ReturnType<ResetPasswordDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ResetPasswordDialogProps>>;
export default _default;
