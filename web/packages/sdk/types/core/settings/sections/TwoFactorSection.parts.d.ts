import type { TwoFactorSection } from './TwoFactorSection';
export declare function Part1({ disableCode, setDisableCode, t }: {
    disableCode: NonNullable<TwoFactorSection['disableCode']>;
    setDisableCode: NonNullable<TwoFactorSection['setDisableCode']>;
    t: NonNullable<TwoFactorSection['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ uri }: {
    uri: NonNullable<TwoFactorSection['uri']>;
}): import("react").JSX.Element;
export declare function Part3({ t, secret }: {
    t: NonNullable<TwoFactorSection['tr']>;
    secret: NonNullable<TwoFactorSection['secret']>;
}): import("react").JSX.Element;
export declare function Part4({ code, setCode, t }: {
    code: NonNullable<TwoFactorSection['code']>;
    setCode: NonNullable<TwoFactorSection['setCode']>;
    t: NonNullable<TwoFactorSection['tr']>;
}): import("react").JSX.Element;
