/**
 * Code-behind of `LdapDirectoryForm.kbview` (converted from `LdapDirectoryForm.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { ComboboxOption } from "@ui";
import type { OrgUnit } from "../../types";
import { type DirectoryForm } from "./types";
import { ViewBase } from './LdapDirectoryForm.kbview';
import * as __parts from './LdapDirectoryForm.parts';
export declare const StepIcons: {
    Network: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    KeyRound: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    Users: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    RefreshCw: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
};
export type LdapDirectoryFormProps = {
    form: DirectoryForm;
    setForm: (f: DirectoryForm) => void;
    isEdit: boolean;
    hasStoredPassword: boolean;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    onClearPassword?: () => void;
};
export declare class LdapDirectoryForm extends ViewBase {
    accessor step: string;
    tr: LdapDirectoryFormStores['t'];
    unitOptions: ComboboxOption[];
    securityOptions: ComboboxOption[];
    scopeOptions: ComboboxOption[];
    missingOptions: ComboboxOption[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        orgUnits: NoInfer<OrgUnit[]> | undefined;
        unitOptions: ComboboxOption[];
        securityOptions: ComboboxOption[];
        scopeOptions: ComboboxOption[];
        missingOptions: ComboboxOption[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canSave(): boolean;
    get steps(): {
        id: string;
        label: string;
    }[];
    get title(): string;
    get part1_props(): {
        steps: {
            id: string;
            label: string;
        }[];
        step: string;
        setStep: (value: LdapDirectoryForm["step"] | ((prev: LdapDirectoryForm["step"]) => LdapDirectoryForm["step"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Stepper> steps: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_step_connection(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        isEdit: boolean;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part4(): typeof __parts.Part4;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part5(): typeof __parts.Part5;
    get part6_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        onSecurityChange: (value: string) => void;
        securityOptions: ComboboxOption[];
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part6(): typeof __parts.Part6;
    get show_form_security_none(): boolean;
    get show_form_security_none2(): boolean;
    /** `<SwitchRow>`, rendered by a ReactHost. */
    get SwitchRow(): typeof __parts.SwitchRow;
    get switch_row_props(): {
        label: string;
        hint?: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    };
    get show_form_verify_certificate(): boolean;
    get part7_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part7(): typeof __parts.Part7;
    get visible(): boolean;
    get visible2(): boolean;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part8(): typeof __parts.Part8;
    get show_step_service(): boolean;
    get part9_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part9(): typeof __parts.Part9;
    get part10_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        hasStoredPassword: boolean;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part10(): typeof __parts.Part10;
    get show_has_stored_password_on_clear_password(): boolean;
    get enabled_unless_saving(): boolean;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part11(): typeof __parts.Part11;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part12(): typeof __parts.Part12;
    get show_form_user_filter(): boolean;
    get part13_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
        scopeOptions: ComboboxOption[];
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part13(): typeof __parts.Part13;
    get show_step_mapping(): boolean;
    get part14_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part14(): typeof __parts.Part14;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part15(): typeof __parts.Part15;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part16(): typeof __parts.Part16;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part17(): typeof __parts.Part17;
    get show_step_sync(): boolean;
    /** `<SwitchRow>`, rendered by a ReactHost. */
    get SwitchRow2(): typeof __parts.SwitchRow;
    get switch_row_props2(): {
        label: string;
        hint?: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    };
    get part18_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
        unitOptions: ComboboxOption[];
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part18(): typeof __parts.Part18;
    get switch_row_props3(): {
        label: string;
        hint?: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    };
    get part19_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part19(): typeof __parts.Part19;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part20(): typeof __parts.Part20;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part21(): typeof __parts.Part21;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part22(): typeof __parts.Part22;
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part23(): typeof __parts.Part23;
    get switch_row_props4(): {
        label: string;
        hint?: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    };
    get part24_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part24(): typeof __parts.Part24;
    get part25_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        form: DirectoryForm;
        set: <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) => void;
        missingOptions: ComboboxOption[];
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (a local or dynamic component)). */
    get Part25(): typeof __parts.Part25;
    get switch_row_props5(): {
        label: string;
        hint?: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    };
    get enabled_unless_can_save(): boolean;
    get button_text(): string;
    set<K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]): void;
    applyPreset(kind: 'standard' | 'ad'): void;
    onSecurityChange(value: string): void;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, _args: MouseEventArgs): void;
    button_click5(_sender: unknown, _args: MouseEventArgs): void;
    /** `setStep` of the TSX: a value, or an update of the previous one. */
    setStep(value: LdapDirectoryForm['step'] | ((prev: LdapDirectoryForm['step']) => LdapDirectoryForm['step'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type LdapDirectoryFormStores = ReturnType<LdapDirectoryForm['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<LdapDirectoryFormProps>>;
export default _default;
