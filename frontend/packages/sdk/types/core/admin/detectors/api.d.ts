export declare const DETECTORS_KEY: readonly ["admin-detectors"];
export type DetectorKind = 'regex' | 'wordlist' | 'checksum';
export type ChecksumAlgo = 'luhn' | 'iban' | 'nir' | 'siret' | 'rib_fr';
export interface Detector {
    id: string;
    key: string;
    label: string;
    description: string | null;
    category: string;
    kind: DetectorKind;
    pattern: string | null;
    terms: string[];
    checksum: ChecksumAlgo | null;
    proximity_terms: string[];
    proximity_window: number;
    proximity_required: boolean;
    base_confidence: number;
    checksum_bonus: number;
    proximity_bonus: number;
    /** The three thresholds. The third is the one that makes a leak rule mean
     *  what it says: fifty copies of one number are not fifty numbers. */
    min_confidence: number;
    min_matches: number;
    min_unique_matches: number;
    is_enabled: boolean;
    is_builtin: boolean;
    created_at: string;
    updated_at: string;
}
export interface DetectorLimits {
    pattern_len: number;
    terms: number;
    term_len: number;
    sample_bytes: number;
    compiled_bytes: number;
}
interface DetectorList {
    detectors: Detector[];
    kinds: DetectorKind[];
    checksums: ChecksumAlgo[];
    limits: DetectorLimits;
}
/** What the editor sends. Every optional field falls back to the server default. */
export interface DetectorInput {
    key: string;
    label: string;
    description?: string | null;
    category?: string;
    kind: DetectorKind;
    pattern?: string | null;
    terms?: string[];
    checksum?: ChecksumAlgo | null;
    proximity_terms?: string[];
    proximity_window?: number;
    proximity_required: boolean;
    base_confidence?: number;
    checksum_bonus?: number;
    proximity_bonus?: number;
    min_confidence?: number;
    min_matches?: number;
    min_unique_matches?: number;
    is_enabled: boolean;
}
/**
 * One match of a trial run.
 *
 * Offsets, never text. The sample lives in the browser — the administrator typed
 * it there — so the highlighting is done locally and the response can keep the
 * promise the rest of the feature makes: no inspected value in a JSON body.
 */
export interface TestMatch {
    start: number;
    end: number;
    confidence: number;
    counted: boolean;
}
export interface TestResult {
    matches: TestMatch[];
    summary: {
        min_confidence: number;
        matches: number;
        unique_matches: number;
        best_confidence: number;
        min_matches: number;
        min_unique_matches: number;
        would_match: boolean;
    };
    scan: {
        bytes: number;
        truncated: boolean;
        timed_out: boolean;
        saturated: boolean;
    };
}
export declare function useDetectors(): import("@tanstack/react-query").UseQueryResult<NoInfer<DetectorList>, Error>;
export declare function useDetector(id: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<{
    detector: Detector;
    used_by: string[];
}>, Error>;
export declare function useCreateDetector(): import("@tanstack/react-query").UseMutationResult<unknown, Error, DetectorInput, unknown>;
export declare function useUpdateDetector(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    input: DetectorInput;
}, unknown>;
export declare function useDeleteDetector(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
/**
 * A trial run. Not a query: nothing about it may be cached, retried or replayed.
 */
export declare function useTestDetector(): import("@tanstack/react-query").UseMutationResult<TestResult, Error, {
    sample: string;
    detector_id?: string;
    draft?: DetectorInput;
    min_confidence?: number;
}, unknown>;
/** Server message of a failed call, falling back to a sentence of our own. */
export declare function errorMessage(err: unknown, fallback: string): string;
export {};
