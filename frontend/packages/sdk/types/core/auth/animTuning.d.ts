export interface AnimParams {
    sigma: number;
    gain: number;
    amp: number;
    speed: number;
    tilt: number;
    nonUniform: number;
    shift: number;
}
export declare const ANIM_DEFAULTS: AnimParams;
/** Slider definitions shared by the admin tuning panel. */
export declare const ANIM_SLIDERS: {
    key: keyof AnimParams;
    label: string;
    min: number;
    max: number;
    step: number;
}[];
/** Parse a raw config value (object from JSONB) into AnimParams, with defaults. */
export declare function parseAnimParams(raw: unknown): AnimParams;
export declare const animTuning: {
    get(): AnimParams;
    set(partial: Partial<AnimParams>): void;
    reset(): void;
    subscribe(fn: () => void): () => void;
};
