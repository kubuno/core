/**
 * Code-behind of `DetectorTrial.kbview` (converted from `DetectorTrial.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type DetectorInput, type TestResult } from "./api";
import { ViewBase } from './DetectorTrial.kbview';
import * as __parts from './DetectorTrial.parts';
interface Props {
    /** A saved detector… */
    detectorId?: string | null;
    /** …or the one being written, so a pattern can be tried before it is saved. */
    draft?: DetectorInput | null;
    /** Reason the draft cannot be tried yet (incomplete form). */
    draftError?: string | null;
}
interface Segment {
    text: string;
    confidence: number | null;
    counted: boolean;
}
export type { Props };
export declare class DetectorTrial extends ViewBase {
    accessor sample: string;
    accessor error: string | null;
    tr: DetectorTrialStores['t'];
    trial: DetectorTrialStores['trial'];
    runs: Segment[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        trial: import("@tanstack/react-query").UseMutationResult<TestResult, Error, {
            sample: string;
            detector_id?: string;
            draft?: DetectorInput;
            min_confidence?: number;
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        runs: Segment[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get result(): TestResult | undefined;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<label htmlFor>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        sample: string;
        setSample: (value: DetectorTrial["sample"] | ((prev: DetectorTrial["sample"]) => DetectorTrial["sample"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<textarea> has no .kbview element yet). */
    get Part2(): typeof __parts.Part2;
    get enabled_unless_sample_trim(): boolean;
    get show_error(): boolean;
    get show_result(): boolean;
    get variant(): "warning" | "info";
    get title(): string;
    get det_trial_counts_count(): number;
    get det_trial_counts_unique(): number;
    get det_trial_counts_best(): string;
    get det_trial_counts_min_matches(): number;
    get det_trial_counts_min_unique(): number;
    get det_trial_counts_min_confidence(): string;
    get show_result_scan_truncated(): boolean;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        result: TestResult;
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        runs: Segment[];
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part4(): typeof __parts.Part4;
    run(): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    /** `setSample` of the TSX: a value, or an update of the previous one. */
    setSample(value: DetectorTrial['sample'] | ((prev: DetectorTrial['sample']) => DetectorTrial['sample'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DetectorTrialStores = ReturnType<DetectorTrial['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DetectorTrialHooks = ReturnType<DetectorTrial['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
