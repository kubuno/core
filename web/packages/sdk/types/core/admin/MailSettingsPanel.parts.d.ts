import type { MailSettingsPanel } from './MailSettingsPanel';
declare function Field({ label, hint, children }: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}): import("react").JSX.Element;
export { Field };
export declare function Part1({ t, form, set }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    form: NonNullable<MailSettingsPanel['form']>;
    set: MailSettingsPanel['set'];
}): import("react").JSX.Element;
export declare function Part2({ t, form, set }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    form: NonNullable<MailSettingsPanel['form']>;
    set: MailSettingsPanel['set'];
}): import("react").JSX.Element;
export declare function Part3({ t, form, onSecurityChange, securityOptions }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    form: NonNullable<MailSettingsPanel['form']>;
    onSecurityChange: MailSettingsPanel['onSecurityChange'];
    securityOptions: NonNullable<MailSettingsPanel['securityOptions']>;
}): import("react").JSX.Element;
export declare function Part4({ t, form, set }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    form: NonNullable<MailSettingsPanel['form']>;
    set: MailSettingsPanel['set'];
}): import("react").JSX.Element;
export declare function Part5({ t, settings, form, set }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    settings: NonNullable<MailSettingsPanel['settings']>;
    form: NonNullable<MailSettingsPanel['form']>;
    set: MailSettingsPanel['set'];
}): import("react").JSX.Element;
export declare function Part6({ t, form, set }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    form: NonNullable<MailSettingsPanel['form']>;
    set: MailSettingsPanel['set'];
}): import("react").JSX.Element;
export declare function Part7({ t, form, set }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    form: NonNullable<MailSettingsPanel['form']>;
    set: MailSettingsPanel['set'];
}): import("react").JSX.Element;
export declare function Part8({ t, form, set }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    form: NonNullable<MailSettingsPanel['form']>;
    set: MailSettingsPanel['set'];
}): import("react").JSX.Element;
export declare function Part9({ t, testRef, testTo, setTestTo, settings }: {
    t: NonNullable<MailSettingsPanel['tr']>;
    testRef: NonNullable<MailSettingsPanel['testRef']>;
    testTo: NonNullable<MailSettingsPanel['testTo']>;
    setTestTo: NonNullable<MailSettingsPanel['setTestTo']>;
    settings: NonNullable<MailSettingsPanel['settings']>;
}): import("react").JSX.Element;
export declare function Part10({ result, t, result_detail, result_hint }: {
    result: NonNullable<MailSettingsPanel['result']>;
    t: NonNullable<MailSettingsPanel['tr']>;
    result_detail: string;
    result_hint: string;
}): import("react").JSX.Element;
