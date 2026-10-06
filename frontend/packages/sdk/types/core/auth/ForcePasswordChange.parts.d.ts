import type { ForcePasswordChange } from './ForcePasswordChange';
export declare function Part1({ t, form, setForm }: {
    t: NonNullable<ForcePasswordChange['tr']>;
    form: NonNullable<ForcePasswordChange['form']>;
    setForm: NonNullable<ForcePasswordChange['setForm']>;
}): import("react").JSX.Element;
export declare function Part2({ t, showPassword, form, setForm }: {
    t: NonNullable<ForcePasswordChange['tr']>;
    showPassword: NonNullable<ForcePasswordChange['showPassword']>;
    form: NonNullable<ForcePasswordChange['form']>;
    setForm: NonNullable<ForcePasswordChange['setForm']>;
}): import("react").JSX.Element;
export declare function Part3({ i, strength }: {
    i: NonNullable<ForcePasswordChange['rows_items']>[number]['i'];
    strength: NonNullable<ForcePasswordChange['strength']>;
}): import("react").JSX.Element;
export declare function Part4({ strength, t }: {
    strength: NonNullable<ForcePasswordChange['strength']>;
    t: NonNullable<ForcePasswordChange['tr']>;
}): import("react").JSX.Element;
