/**
 * Clipboard fallback used by the settings sections when `navigator.clipboard`
 * is unavailable (insecure context, older browsers).
 */
export declare function fallbackCopy(text: string, onSuccess: () => void): void;
