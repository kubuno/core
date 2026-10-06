import type { CreateTokenForm } from './CreateTokenForm';
export declare function Part1({ t, expiresInDays, setExpiresInDays, expiryMandatory, maxTtlDays }: {
    t: NonNullable<CreateTokenForm['tr']>;
    expiresInDays: NonNullable<CreateTokenForm['expiresInDays']>;
    setExpiresInDays: NonNullable<CreateTokenForm['setExpiresInDays']>;
    expiryMandatory: NonNullable<CreateTokenForm['expiryMandatory']>;
    maxTtlDays: NonNullable<CreateTokenForm['maxTtlDays']>;
}): import("react").JSX.Element;
