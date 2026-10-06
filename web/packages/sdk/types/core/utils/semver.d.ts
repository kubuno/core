/**
 * Minimal SemVer comparison — no dependency, because the only question we ever
 * ask is "is the catalogue ahead of what is installed?".
 *
 * Comparing versions as plain strings made the Marketplace offer 0.1.8 to an
 * instance already running 0.1.10, because "0.1.10" !== "0.1.8" and the button
 * only checked for a difference. Any comparison that is not numeric, segment by
 * segment, invites an administrator to downgrade.
 */
/** `-1`, `0` or `1`, comparing release segments numerically. */
export declare function compareVersions(a: string, b: string): number;
/** True only when `candidate` is strictly newer than `installed`. */
export declare function isNewerVersion(candidate: string, installed: string): boolean;
