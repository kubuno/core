/**
 * Code-behind of `ForcePasswordChange.kbview` (converted from `ForcePasswordChange.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { InstanceLogo } from "../shell/InstanceLogo";
import { ViewBase } from './ForcePasswordChange.kbview';
import * as __parts from './ForcePasswordChange.parts';
export declare class ForcePasswordChange extends ViewBase {
    accessor form: {
        current: string;
        next: string;
        confirm: string;
    };
    accessor showPassword: boolean;
    accessor error: string;
    accessor isLoading: boolean;
    tr: ForcePasswordChangeStores['t'];
    email: string;
    login: (email: string, password: string, captcha?: {
        id: string;
        answer: string;
    }) => Promise<{
        requiresTotp: boolean;
    }>;
    updateUser: ForcePasswordChangeStores['updateUser'];
    logout: () => Promise<void>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        email: string;
        login: (email: string, password: string, captcha?: {
            id: string;
            answer: string;
        }) => Promise<{
            requiresTotp: boolean;
        }>;
        updateUser: (updates: Partial<import("../types").User>) => void;
        logout: () => Promise<void>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get strength(): import("./passwordStrength").PasswordStrength;
    /** `<InstanceLogo>`, rendered by a ReactHost. */
    get InstanceLogo(): typeof InstanceLogo;
    get instance_logo_props(): {
        size: number;
        className: string;
    };
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: {
            current: string;
            next: string;
            confirm: string;
        };
        setForm: (value: ForcePasswordChange["form"] | ((prev: ForcePasswordChange["form"]) => ForcePasswordChange["form"])) => void;
    };
    /** A part of the screen still written in React (<TextField> autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        showPassword: boolean;
        form: {
            current: string;
            next: string;
            confirm: string;
        };
        setForm: (value: ForcePasswordChange["form"] | ((prev: ForcePasswordChange["form"]) => ForcePasswordChange["form"])) => void;
    };
    /** A part of the screen still written in React (<TextField> minLength: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get show_not_show_password(): boolean;
    get show_form_next(): boolean;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part3(): typeof __parts.Part3;
    /** The rows of the Repeater over `Array.from({ length: 5 })`. */
    get rows_items(): {
        _: unknown;
        i: number;
        part3_props: {
            i: number;
            strength: import("./passwordStrength").PasswordStrength;
        } | undefined;
        key: number;
    }[];
    get part4_props(): {
        strength: import("./passwordStrength").PasswordStrength;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<span> with a computed style). */
    get Part4(): typeof __parts.Part4;
    get show_error(): boolean;
    handleSubmit(e: React.FormEvent): Promise<void>;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    /** `setForm` of the TSX: a value, or an update of the previous one. */
    setForm(value: ForcePasswordChange['form'] | ((prev: ForcePasswordChange['form']) => ForcePasswordChange['form'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ForcePasswordChangeStores = ReturnType<ForcePasswordChange['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
