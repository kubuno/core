import type { ResetPasswordPage } from './ResetPasswordPage';
export declare function Part1({ t, showPassword, form, setForm }: {
    t: NonNullable<ResetPasswordPage['tr']>;
    showPassword: NonNullable<ResetPasswordPage['showPassword']>;
    form: NonNullable<ResetPasswordPage['form']>;
    setForm: NonNullable<ResetPasswordPage['setForm']>;
}): import("react").JSX.Element;
export declare function Part2({ i, strength }: {
    i: NonNullable<ResetPasswordPage['rows_items']>[number]['i'];
    strength: NonNullable<ResetPasswordPage['strength']>;
}): import("react").JSX.Element;
export declare function Part3({ strength, t }: {
    strength: NonNullable<ResetPasswordPage['strength']>;
    t: NonNullable<ResetPasswordPage['tr']>;
}): import("react").JSX.Element;
