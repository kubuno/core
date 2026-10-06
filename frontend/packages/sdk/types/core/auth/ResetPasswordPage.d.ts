/**
 * Code-behind of `ResetPasswordPage.kbview` (converted from `ResetPasswordPage.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs, type EventArgs } from '@kubuno/views';
import { useNavigate } from 'react-router-dom';
import { InstanceLogo } from "../shell/InstanceLogo";
import { ViewBase } from './ResetPasswordPage.kbview';
import * as __parts from './ResetPasswordPage.parts';
export declare class ResetPasswordPage extends ViewBase {
    accessor form: {
        next: string;
        confirm: string;
    };
    accessor showPassword: boolean;
    accessor error: string;
    accessor isLoading: boolean;
    accessor done: boolean;
    tr: ResetPasswordPageStores['t'];
    params: URLSearchParams;
    navigate: ReturnType<typeof useNavigate>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        params: URLSearchParams;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get token(): string;
    get strength(): import("./passwordStrength").PasswordStrength;
    /** `<InstanceLogo>`, rendered by a ReactHost. */
    get InstanceLogo(): typeof InstanceLogo;
    get instance_logo_props(): {
        size: number;
        className: string;
    };
    get show_not_done(): boolean;
    get show_token(): boolean;
    get show_not_token(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        showPassword: boolean;
        form: {
            next: string;
            confirm: string;
        };
        setForm: (value: ResetPasswordPage["form"] | ((prev: ResetPasswordPage["form"]) => ResetPasswordPage["form"])) => void;
    };
    /** A part of the screen still written in React (<TextField> minLength, autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_not_show_password(): boolean;
    get show_form_next(): boolean;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `Array.from({ length: 5 })`. */
    get rows_items(): {
        _: unknown;
        i: number;
        part2_props: {
            i: number;
            strength: import("./passwordStrength").PasswordStrength;
        } | undefined;
        key: number;
    }[];
    get part3_props(): {
        strength: import("./passwordStrength").PasswordStrength;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<span> with a computed style). */
    get Part3(): typeof __parts.Part3;
    get show_error(): boolean;
    get visible(): boolean;
    get visible2(): boolean;
    handleSubmit(e: React.FormEvent): Promise<void>;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click2(_sender: unknown, _args: MouseEventArgs): void;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
    panel_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    text_field_text_changed(_sender: unknown, args: EventArgs): undefined;
    link_label_click(_sender: unknown, _args: MouseEventArgs): void;
    /** `setForm` of the TSX: a value, or an update of the previous one. */
    setForm(value: ResetPasswordPage['form'] | ((prev: ResetPasswordPage['form']) => ResetPasswordPage['form'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ResetPasswordPageStores = ReturnType<ResetPasswordPage['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
