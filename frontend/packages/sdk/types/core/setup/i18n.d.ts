export declare const SETUP_NS = "setup";
/** Registers the namespace.
 *
 * Through `registerModuleTranslations`, never `addResourceBundle` directly:
 * `i18n.init()` is asynchronous and REBUILDS the resource store when it
 * completes, wiping every bundle added during boot. That is what once made the
 * language selector look inert — the translations were there, then silently
 * gone. The helper remembers the bundle and re-applies it after init. */
export declare function registerSetupI18n(): void;
