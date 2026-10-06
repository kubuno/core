/**
 * Code-behind of `MailSettingsPanel.kbview` (converted from `MailSettingsPanel.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import type { DropdownOption } from "@ui";
import { ViewBase } from './MailSettingsPanel.kbview';
import * as __parts from './MailSettingsPanel.parts';
interface MailSettings {
    enabled: boolean;
    host: string;
    port: number;
    security: 'none' | 'starttls' | 'tls';
    username: string;
    has_password: boolean;
    from_address: string;
    from_name: string;
    public_url: string;
    usable: boolean;
}
interface TestResult {
    ok: boolean;
    message: string;
    detail?: string;
    hint?: string;
    to: string;
    host: string;
    port: number;
    security: string;
    elapsed_ms: number;
}
interface FormState {
    enabled: boolean;
    host: string;
    port: string;
    security: string;
    username: string;
    password: string;
    from_address: string;
    from_name: string;
    public_url: string;
}
export declare class MailSettingsPanel extends ViewBase {
    accessor form: FormState | null;
    accessor testTo: string;
    accessor result: TestResult | null;
    accessor wantTest: boolean;
    tr: MailSettingsPanelStores['t'];
    toast: MailSettingsPanelStores['toast'];
    testRef: MailSettingsPanelStores['testRef'];
    settings: MailSettingsPanelStores['settings'];
    isLoading: boolean;
    save: MailSettingsPanelStores['save'];
    sendTest: MailSettingsPanelHooks['sendTest'];
    securityOptions: DropdownOption[];
    dirty: boolean;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        toast: import("@ui").ToastApi;
        testRef: import("react").RefObject<HTMLInputElement | null>;
        settings: NoInfer<MailSettings> | undefined;
        isLoading: boolean;
        save: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, Record<string, unknown>, unknown>;
        securityOptions: DropdownOption[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        sendTest: import("@tanstack/react-query").UseMutationResult<TestResult, unknown, void, unknown>;
        dirty: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get show_settings_usable(): boolean;
    get variant(): "warning" | "info";
    get callout_text(): string;
    get on(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: FormState;
        set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: FormState;
        onSecurityChange: (value: string) => undefined;
        securityOptions: DropdownOption[];
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part4(): typeof __parts.Part4;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        settings: NoInfer<MailSettings>;
        form: FormState;
        set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part5(): typeof __parts.Part5;
    get show_settings_has_password(): boolean;
    get enabled_unless_save_is_pending(): boolean;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part6(): typeof __parts.Part6;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part7(): typeof __parts.Part7;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part8(): typeof __parts.Part8;
    get part9_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        testRef: import("react").RefObject<HTMLInputElement | null>;
        testTo: string;
        setTestTo: (value: MailSettingsPanel["testTo"] | ((prev: MailSettingsPanel["testTo"]) => MailSettingsPanel["testTo"])) => void;
        settings: NoInfer<MailSettings>;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part9(): typeof __parts.Part9;
    get enabled_unless_dirty(): boolean;
    get show_result(): boolean;
    get part10_props(): {
        result: TestResult;
        t: import("i18next").TFunction<"translation", undefined>;
        result_detail: string | undefined;
        result_hint: string | undefined;
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part10(): typeof __parts.Part10;
    set<K extends keyof FormState>(key: K, value: FormState[K]): void;
    submit(): undefined;
    clearPassword(): void;
    onSecurityChange(value: string): undefined;
    switch_checked_changed(_sender: unknown, args: EventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setResult` of the TSX: a value, or an update of the previous one. */
    setResult(value: TestResult | null | ((prev: TestResult | null) => TestResult | null)): void;
    /** `setTestTo` of the TSX: a value, or an update of the previous one. */
    setTestTo(value: MailSettingsPanel['testTo'] | ((prev: MailSettingsPanel['testTo']) => MailSettingsPanel['testTo'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MailSettingsPanelStores = ReturnType<MailSettingsPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type MailSettingsPanelHooks = ReturnType<MailSettingsPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
