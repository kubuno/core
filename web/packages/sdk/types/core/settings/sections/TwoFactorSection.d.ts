/**
 * Code-behind of `TwoFactorSection.kbview` (converted from `TwoFactorSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { BackupCodesPanel } from "./BackupCodesPanel";
import { ViewBase } from './TwoFactorSection.kbview';
import * as __parts from './TwoFactorSection.parts';
type TotpSetupStep = 'idle' | 'qr' | 'verify' | 'codes' | 'done';
interface Admin2faStatus {
    required: boolean;
    satisfied: boolean;
    grace_until: string | null;
    days_left: number | null;
    locked_out: boolean;
}
export declare class TwoFactorSection extends ViewBase {
    accessor step: TotpSetupStep;
    accessor uri: string;
    accessor secret: string;
    accessor code: string;
    accessor error: string;
    accessor disableCode: string;
    accessor disableError: string;
    accessor showDisableForm: boolean;
    accessor freshCodes: string[];
    accessor requirement: Admin2faStatus | null;
    tr: TwoFactorSectionStores['t'];
    user: TwoFactorSectionStores['user'];
    updateUser: TwoFactorSectionStores['updateUser'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        user: import("../../types").User | null;
        updateUser: (updates: Partial<import("../../types").User>) => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {};
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get enabled(): boolean;
    get requirementBanner(): import("react").JSX.Element | null;
    get show_case_1(): boolean;
    /** `<BackupCodesPanel>`, rendered by a ReactHost. */
    get BackupCodesPanel(): typeof BackupCodesPanel;
    get backup_codes_panel_props(): import("./BackupCodesPanel").Props;
    get show_case_2(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_requirement_banner(): {
        children: import("react").JSX.Element | null;
    };
    /** `<BackupCodesSection>`, rendered by a ReactHost. */
    get BackupCodesSection(): import("react").FunctionComponent<Readonly<{}>>;
    get show_show_disable_form(): boolean;
    get show_not_show_disable_form(): boolean;
    get part1_props(): {
        disableCode: string;
        setDisableCode: (value: TwoFactorSection["disableCode"] | ((prev: TwoFactorSection["disableCode"]) => TwoFactorSection["disableCode"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextField> inputMode, autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_disable_error(): boolean;
    get enabled_unless_disable_code(): boolean;
    get show_case_3(): boolean;
    get show_case_4(): boolean;
    get part2_props(): {
        uri: string;
    };
    /** A part of the screen still written in React (<QRCode> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        secret: string;
    };
    /** A part of the screen still written in React (<details> has no .kbview element yet). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        code: string;
        setCode: (value: TwoFactorSection["code"] | ((prev: TwoFactorSection["code"]) => TwoFactorSection["code"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextField> inputMode, autoFocus: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get show_error(): boolean;
    get enabled_unless_code(): boolean;
    get show_main(): boolean;
    get content_requirement_banner2(): {
        children: import("react").JSX.Element | null;
    };
    get show_error2(): boolean;
    startSetup(): Promise<void>;
    enableTotp(e: React.FormEvent): Promise<void>;
    disableTotp(e: React.FormEvent): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_submit2(_sender: unknown, args: EventArgs): Promise<void>;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setDisableCode` of the TSX: a value, or an update of the previous one. */
    setDisableCode(value: TwoFactorSection['disableCode'] | ((prev: TwoFactorSection['disableCode']) => TwoFactorSection['disableCode'])): void;
    /** `setCode` of the TSX: a value, or an update of the previous one. */
    setCode(value: TwoFactorSection['code'] | ((prev: TwoFactorSection['code']) => TwoFactorSection['code'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type TwoFactorSectionStores = ReturnType<TwoFactorSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type TwoFactorSectionHooks = ReturnType<TwoFactorSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
