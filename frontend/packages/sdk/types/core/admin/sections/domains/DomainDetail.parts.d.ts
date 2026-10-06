import type { DomainDetail } from './DomainDetail';
declare function RecordField({ label, value }: {
    label: string;
    value: string;
}): import("react").JSX.Element;
export { RecordField };
export declare function Part1({ t, domain, domain_last_error, canManage, verify, setError, toast, fail, domain_last_checked_at }: {
    t: NonNullable<DomainDetail['tr']>;
    domain: NonNullable<DomainDetail['domain']>;
    domain_last_error: string;
    canManage: NonNullable<DomainDetail['props']['canManage']>;
    verify: NonNullable<DomainDetail['verify']>;
    setError: NonNullable<DomainDetail['setError']>;
    toast: NonNullable<DomainDetail['toast']>;
    fail: DomainDetail['fail'];
    domain_last_checked_at: string;
}): import("react").JSX.Element;
export declare function Part2({ domain, promote, t, confirm, setError, toast, fail }: {
    domain: NonNullable<DomainDetail['domain']>;
    promote: NonNullable<DomainDetail['promote']>;
    t: NonNullable<DomainDetail['tr']>;
    confirm: NonNullable<DomainDetail['confirm']>;
    setError: NonNullable<DomainDetail['setError']>;
    toast: NonNullable<DomainDetail['toast']>;
    fail: DomainDetail['fail'];
}): import("react").JSX.Element;
export declare function Part3({ blockers, remove, confirm, t, domain, setError, onGone, fail }: {
    blockers: NonNullable<DomainDetail['blockers']>;
    remove: NonNullable<DomainDetail['remove']>;
    confirm: NonNullable<DomainDetail['confirm']>;
    t: NonNullable<DomainDetail['tr']>;
    domain: NonNullable<DomainDetail['domain']>;
    setError: NonNullable<DomainDetail['setError']>;
    onGone: NonNullable<DomainDetail['props']['onGone']>;
    fail: DomainDetail['fail'];
}): import("react").JSX.Element;
