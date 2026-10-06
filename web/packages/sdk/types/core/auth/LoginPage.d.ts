/**
 * Code-behind of `LoginPage.kbview` (converted from `LoginPage.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type CaptchaChallenge } from "../api/auth";
import LoginAnimation from "./LoginAnimationGL";
import { InstanceLogo } from "../shell/InstanceLogo";
import { ViewBase } from './LoginPage.kbview';
import * as __parts from './LoginPage.parts';
interface OAuthProviderInfo {
    slug: string;
    display_name: string;
    button_color: string | null;
}
export type LoginPageProps = {
    initialStep?: 'credentials' | 'forgot';
};
export declare class LoginPage extends ViewBase {
    accessor login: string;
    accessor password: string;
    accessor showPassword: boolean;
    accessor error: string;
    accessor captchaRequired: boolean;
    accessor captcha: CaptchaChallenge | null;
    accessor captchaAnswer: string;
    accessor sliderX: number;
    accessor captchaLoading: boolean;
    accessor totpCode: string;
    accessor useBackupCode: boolean;
    accessor forgotEmail: string;
    accessor forgotSubmitted: boolean;
    accessor forgotLoading: boolean;
    step: 'credentials' | 'totp' | 'forgot';
    setStep: LoginPageHooks['setStep'];
    doLogin: (email: string, password: string, captcha?: {
        id: string;
        answer: string;
    }) => Promise<{
        requiresTotp: boolean;
    }>;
    verifyTotp: (code: string, kind?: "totp" | "backup") => Promise<void>;
    isLoading: boolean;
    tr: LoginPageStores['t'];
    navigate: LoginPageStores['navigate'];
    location: LoginPageStores['location'];
    registrationOpen: boolean;
    defaultModulePath: string | null;
    oauthProviders: LoginPageStores['oauthProviders'];
    authMethods: LoginPageStores['authMethods'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        doLogin: (email: string, password: string, captcha?: {
            id: string;
            answer: string;
        }) => Promise<{
            requiresTotp: boolean;
        }>;
        verifyTotp: (code: string, kind?: "totp" | "backup") => Promise<void>;
        isLoading: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        navigate: import("react-router").NavigateFunction;
        location: import("react-router").Location<any>;
        registrationOpen: boolean;
        defaultModulePath: string | null;
        oauthProviders: NoInfer<OAuthProviderInfo[]> | undefined;
        authMethods: NoInfer<{
            methods: {
                local: boolean;
                directory: boolean;
                sso: boolean;
            };
            password_form: boolean;
        }> | undefined;
        publicConfig: NoInfer<import("../api/publicConfig").PublicConfig> | undefined;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        step: "credentials" | "totp" | "forgot";
        setStep: import("react").Dispatch<import("react").SetStateAction<"credentials" | "totp" | "forgot">>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get initialStep(): "credentials" | "forgot";
    get showPasswordForm(): boolean;
    get showProviders(): boolean;
    get from(): string | undefined;
    /** `<LoginAnimation>`, rendered by a ReactHost. */
    get LoginAnimation(): typeof LoginAnimation;
    get login_animation_props(): {
        yShift: number;
    };
    /** `<InstanceLogo>`, rendered by a ReactHost. */
    get InstanceLogo(): typeof InstanceLogo;
    get instance_logo_props(): {
        size: number;
        className: string;
    };
    get span_text(): string;
    get tooltip(): string;
    get instance_logo_props2(): {
        size: number;
        className: string;
    };
    get show_step_totp(): boolean;
    get show_not_step_totp(): boolean;
    get p_text(): string;
    get part1_props(): {
        useBackupCode: boolean;
        totpCode: string;
        setTotpCode: (value: LoginPage["totpCode"] | ((prev: LoginPage["totpCode"]) => LoginPage["totpCode"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<div onFocusCapture onBlurCapture>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_error(): boolean;
    get text(): string;
    get enabled_unless_use_backup_code_totp_code_replace(): boolean;
    get button_text(): string;
    get show_step_forgot(): boolean;
    get show_not_step_forgot(): boolean;
    get show_not_forgot_submitted(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part2(): typeof __parts.Part2;
    /** `<OutlinedField>`, rendered by a ReactHost. */
    get OutlinedField(): typeof import("../../ui/OutlinedField").OutlinedField;
    get outlined_field_props(): {
        label: string;
        value: string;
        onChange: (value: LoginPage["forgotEmail"] | ((prev: LoginPage["forgotEmail"]) => LoginPage["forgotEmail"])) => void;
        type: string;
        inputMode: string;
        autoComplete: string;
        autoFocus: boolean;
        primaryColor: string;
    };
    get enabled_unless_forgot_email_trim(): boolean;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part3(): typeof __parts.Part3;
    get visible(): boolean;
    get visible2(): boolean;
    /** A part of the screen still written in React (<a> with a computed style). */
    get Part4(): typeof __parts.Part4;
    /** The rows of the Repeater over `oauthProviders!`. */
    get rows_oauth_providers(): {
        p: OAuthProviderInfo;
        part4_props: {
            p: OAuthProviderInfo;
            t: import("i18next").TFunction<"translation", undefined>;
        } | undefined;
        key: string;
    }[];
    get visible3(): boolean;
    get show_show_password_form_show_providers(): boolean;
    /** `<OutlinedField>`, rendered by a ReactHost. */
    get OutlinedField2(): typeof import("../../ui/OutlinedField").OutlinedField;
    get outlined_field_props2(): {
        label: string;
        value: string;
        onChange: (value: LoginPage["login"] | ((prev: LoginPage["login"]) => LoginPage["login"])) => void;
        autoComplete: string;
        primaryColor: string;
    };
    get outlined_field_props3(): {
        label: string;
        value: string;
        onChange: (value: LoginPage["password"] | ((prev: LoginPage["password"]) => LoginPage["password"])) => void;
        type: string;
        autoComplete: string;
        primaryColor: string;
        trailing: import("react").JSX.Element;
    };
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part5(): typeof __parts.Part5;
    get show_captcha_required_captcha(): boolean;
    get label_text(): string;
    get enabled_unless_captcha_loading(): boolean;
    get part6_props(): {
        captchaLoading: boolean;
    };
    /** A part of the screen still written in React (an icon with a computed className). */
    get Part6(): typeof __parts.Part6;
    get show_captcha_type_text(): boolean;
    get part7_props(): {
        captcha: CaptchaChallenge;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<img> has no .kbview element yet). */
    get Part7(): typeof __parts.Part7;
    get part8_props(): {
        captchaAnswer: string;
        setCaptchaAnswer: (value: LoginPage["captchaAnswer"] | ((prev: LoginPage["captchaAnswer"]) => LoginPage["captchaAnswer"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<div onFocusCapture onBlurCapture>: attribute(s) without a .kbview property). */
    get Part8(): typeof __parts.Part8;
    get show_captcha_type_math(): boolean;
    get part9_props(): {
        captcha: CaptchaChallenge;
        captchaAnswer: string;
        setCaptchaAnswer: (value: LoginPage["captchaAnswer"] | ((prev: LoginPage["captchaAnswer"]) => LoginPage["captchaAnswer"])) => void;
    };
    /** A part of the screen still written in React (<div onFocusCapture onBlurCapture>: attribute(s) without a .kbview property). */
    get Part9(): typeof __parts.Part9;
    get show_captcha_type_slider(): boolean;
    get part10_props(): {
        captcha: CaptchaChallenge;
        sliderX: number;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part10(): typeof __parts.Part10;
    get part11_props(): {
        captcha: CaptchaChallenge;
        sliderX: number;
        setSliderX: (value: LoginPage["sliderX"] | ((prev: LoginPage["sliderX"]) => LoginPage["sliderX"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part11(): typeof __parts.Part11;
    get show_error2(): boolean;
    get part12_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part12(): typeof __parts.Part12;
    get enabled_unless_login_trim_password(): boolean;
    get button_text2(): string;
    get visible4(): boolean;
    get visible5(): boolean;
    get visible6(): boolean;
    get visible7(): boolean;
    get visible8(): boolean;
    get visible9(): boolean;
    get visible10(): boolean;
    get visible11(): boolean;
    get visible12(): boolean;
    get visible13(): boolean;
    get visible14(): boolean;
    get visible15(): boolean;
    postLoginPath(): string;
    loadCaptcha(): Promise<void>;
    handleSubmit(e: React.FormEvent): Promise<void>;
    handleTotpSubmit(e: React.FormEvent): Promise<void>;
    handleForgotSubmit(e: React.FormEvent): Promise<void>;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_submit2(_sender: unknown, args: EventArgs): Promise<void>;
    panel_submit3(_sender: unknown, args: EventArgs): Promise<void>;
    /** `setTotpCode` of the TSX: a value, or an update of the previous one. */
    setTotpCode(value: LoginPage['totpCode'] | ((prev: LoginPage['totpCode']) => LoginPage['totpCode'])): void;
    /** `setForgotEmail` of the TSX: a value, or an update of the previous one. */
    setForgotEmail(value: LoginPage['forgotEmail'] | ((prev: LoginPage['forgotEmail']) => LoginPage['forgotEmail'])): void;
    /** `setLogin` of the TSX: a value, or an update of the previous one. */
    setLogin(value: LoginPage['login'] | ((prev: LoginPage['login']) => LoginPage['login'])): void;
    /** `setPassword` of the TSX: a value, or an update of the previous one. */
    setPassword(value: LoginPage['password'] | ((prev: LoginPage['password']) => LoginPage['password'])): void;
    /** `setCaptchaAnswer` of the TSX: a value, or an update of the previous one. */
    setCaptchaAnswer(value: LoginPage['captchaAnswer'] | ((prev: LoginPage['captchaAnswer']) => LoginPage['captchaAnswer'])): void;
    /** `setSliderX` of the TSX: a value, or an update of the previous one. */
    setSliderX(value: LoginPage['sliderX'] | ((prev: LoginPage['sliderX']) => LoginPage['sliderX'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type LoginPageStores = ReturnType<LoginPage['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type LoginPageHooks = ReturnType<LoginPage['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<LoginPageProps>>;
export default _default;
