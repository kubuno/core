/**
 * Code-behind of `RegisterPage.kbview` (converted from `RegisterPage.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { InstanceLogo } from "../shell/InstanceLogo";
import { ViewBase } from './RegisterPage.kbview';
import * as __parts from './RegisterPage.parts';
export declare class RegisterPage extends ViewBase {
    accessor form: {
        email: string;
        username: string;
        password: string;
        confirm: string;
        display_name: string;
    };
    accessor showPassword: boolean;
    accessor error: string;
    accessor isLoading: boolean;
    tr: RegisterPageStores['t'];
    navigate: RegisterPageStores['navigate'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        navigate: import("react-router").NavigateFunction;
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
            email: string;
            username: string;
            password: string;
            confirm: string;
            display_name: string;
        };
        handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    };
    /** A part of the screen still written in React (<TextField> name: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
    get Part2(): typeof __parts.Part2;
    /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        showPassword: boolean;
        form: {
            email: string;
            username: string;
            password: string;
            confirm: string;
            display_name: string;
        };
        handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    };
    /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
    get Part4(): typeof __parts.Part4;
    get show_not_show_password(): boolean;
    get show_form_password(): boolean;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part5(): typeof __parts.Part5;
    /** The rows of the Repeater over `Array.from({ length: 5 })`. */
    get rows_items(): {
        _: unknown;
        i: number;
        part5_props: {
            i: number;
            strength: import("./passwordStrength").PasswordStrength;
        } | undefined;
        key: number;
    }[];
    get part6_props(): {
        strength: import("./passwordStrength").PasswordStrength;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<span> with a computed style). */
    get Part6(): typeof __parts.Part6;
    /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
    get Part7(): typeof __parts.Part7;
    get show_error(): boolean;
    handleChange(e: React.ChangeEvent<HTMLInputElement>): void;
    handleSubmit(e: React.FormEvent): Promise<void>;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    link_label_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RegisterPageStores = ReturnType<RegisterPage['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
