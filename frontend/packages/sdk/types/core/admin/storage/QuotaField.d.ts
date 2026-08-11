/**
 * A quota entered the way an operator says it — "50 Go" — rather than the way it
 * is stored.
 *
 * The stored value is a byte count, and a byte count is what an operator gets
 * wrong: `53687091200` and `5368709120` differ by one character and by a factor
 * of ten, and the settings page has been offering exactly that field. Here the
 * number and its unit are separate controls, and the byte value is shown
 * underneath so what is about to be written is never hidden.
 *
 * The unit is three buttons rather than a select: there are three of them, they
 * are one character wide, and `@ui`'s Dropdown does not follow the dark theme.
 */
declare const UNITS: readonly [{
    readonly id: "MiB";
    readonly label: "Mo";
    readonly factor: number;
}, {
    readonly id: "GiB";
    readonly label: "Go";
    readonly factor: number;
}, {
    readonly id: "TiB";
    readonly label: "To";
    readonly factor: number;
}];
export type QuotaUnit = (typeof UNITS)[number]['id'];
/** Splits a byte count into the largest unit that keeps it readable. */
export declare function splitQuota(bytes: number): {
    amount: string;
    unit: QuotaUnit;
};
export declare function toBytes(amount: string, unit: QuotaUnit): number | null;
export declare function QuotaField({ amount, unit, onAmount, onUnit, label, hint, error, autoFocus, }: {
    amount: string;
    unit: QuotaUnit;
    onAmount: (v: string) => void;
    onUnit: (u: QuotaUnit) => void;
    label: string;
    hint?: string;
    error?: string;
    autoFocus?: boolean;
}): import("react").JSX.Element;
export {};
