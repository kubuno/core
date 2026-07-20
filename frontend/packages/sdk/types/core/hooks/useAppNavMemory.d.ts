/**
 * Record the last visited location of the current application (per tab) so the
 * app launcher can return the user exactly where they left off. The application
 * is resolved by the longest matching waffle-app path prefix, so a sub-module
 * (e.g. /paintsharp/apex/123) is remembered under its own id.
 */
export declare function useAppNavMemory(): void;
