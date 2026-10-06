import type { DetectorTrial } from './DetectorTrial';
export declare function Part1({ t }: {
    t: NonNullable<DetectorTrial['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ sample, setSample, t }: {
    sample: NonNullable<DetectorTrial['sample']>;
    setSample: NonNullable<DetectorTrial['setSample']>;
    t: NonNullable<DetectorTrial['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ t, result }: {
    t: NonNullable<DetectorTrial['tr']>;
    result: NonNullable<DetectorTrial['result']>;
}): import("react").JSX.Element;
export declare function Part4({ runs }: {
    runs: NonNullable<DetectorTrial['runs']>;
}): import("react").JSX.Element;
