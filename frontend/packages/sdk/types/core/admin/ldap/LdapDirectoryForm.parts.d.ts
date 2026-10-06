/**
 * The parts of `LdapDirectoryForm.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ReactNode } from "react";
import type { LdapDirectoryForm } from './LdapDirectoryForm';
declare function Field({ label, hint, children, }: {
    label: string;
    hint?: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
export { Field };
declare function SwitchRow({ label, hint, checked, onChange, }: {
    label: string;
    hint?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}): import("react").JSX.Element;
export { SwitchRow };
export declare function Part1({ steps, step, setStep, t }: {
    steps: NonNullable<LdapDirectoryForm['steps']>;
    step: NonNullable<LdapDirectoryForm['step']>;
    setStep: NonNullable<LdapDirectoryForm['setStep']>;
    t: NonNullable<LdapDirectoryForm['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t, form, isEdit, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    isEdit: NonNullable<LdapDirectoryForm['props']['isEdit']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part3({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part4({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part5({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part6({ t, form, onSecurityChange, securityOptions }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    onSecurityChange: LdapDirectoryForm['onSecurityChange'];
    securityOptions: NonNullable<LdapDirectoryForm['securityOptions']>;
}): import("react").JSX.Element;
export declare function Part7({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part8({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part9({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part10({ t, hasStoredPassword, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    hasStoredPassword: NonNullable<LdapDirectoryForm['props']['hasStoredPassword']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part11({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part12({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part13({ t, form, set, scopeOptions }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
    scopeOptions: NonNullable<LdapDirectoryForm['scopeOptions']>;
}): import("react").JSX.Element;
export declare function Part14({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part15({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part16({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part17({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part18({ t, form, set, unitOptions }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
    unitOptions: NonNullable<LdapDirectoryForm['unitOptions']>;
}): import("react").JSX.Element;
export declare function Part19({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part20({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part21({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part22({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part23({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part24({ t, form, set }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
}): import("react").JSX.Element;
export declare function Part25({ t, form, set, missingOptions }: {
    t: NonNullable<LdapDirectoryForm['tr']>;
    form: NonNullable<LdapDirectoryForm['props']['form']>;
    set: LdapDirectoryForm['set'];
    missingOptions: NonNullable<LdapDirectoryForm['missingOptions']>;
}): import("react").JSX.Element;
