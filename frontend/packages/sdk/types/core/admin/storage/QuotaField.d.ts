import { ViewBase } from './QuotaField.kbview';
import * as __parts from './QuotaField.parts';
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
export declare function splitQuota(bytes: number): {
    amount: string;
    unit: QuotaUnit;
};
export declare function toBytes(amount: string, unit: QuotaUnit): number | null;
export type QuotaFieldProps = {
    amount: string;
    unit: QuotaUnit;
    onAmount: (v: string) => void;
    onUnit: (u: QuotaUnit) => void;
    label: string;
    hint?: string;
    error?: string;
    autoFocus?: boolean;
};
export declare class QuotaField extends ViewBase {
    bytes: number | null;
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        bytes: number | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        label: string;
        amount: string;
        autoFocus: boolean | undefined;
        onAmount: (v: string) => void;
        error: string | undefined;
    };
    /** A part of the screen still written in React (<TextField> inputMode, autoFocus: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<button aria-pressed>: attribute(s) without a .kbview property). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `UNITS`. */
    get rows_units(): {
        u: {
            readonly id: "MiB";
            readonly label: "Mo";
            readonly factor: number;
        } | {
            readonly id: "GiB";
            readonly label: "Go";
            readonly factor: number;
        } | {
            readonly id: "TiB";
            readonly label: "To";
            readonly factor: number;
        };
        part2_props: {
            u: {
                readonly id: "MiB";
                readonly label: "Mo";
                readonly factor: number;
            } | {
                readonly id: "GiB";
                readonly label: "Go";
                readonly factor: number;
            } | {
                readonly id: "TiB";
                readonly label: "To";
                readonly factor: number;
            };
            unit: "MiB" | "GiB" | "TiB";
            onUnit: (u: QuotaUnit) => void;
        };
        key: "MiB" | "GiB" | "TiB";
    }[];
    get show_hint_bytes(): boolean;
    get text(): "" | " · ";
    get show_bytes(): boolean;
    get span_text(): string;
}
/** What `useHooks()` gives (the types of the fields it fills). */
export type QuotaFieldHooks = ReturnType<QuotaField['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<QuotaFieldProps>>;
export default _default;
