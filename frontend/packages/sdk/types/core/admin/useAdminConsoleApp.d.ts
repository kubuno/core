/** The console's id in the app registry. Not a module id: no process answers to it. */
export declare const ADMIN_APP_ID = "core-admin";
export declare const ADMIN_FAVICON = "/admin-logo.png";
/**
 * Registers the administration console as an app, exactly as a module registers
 * itself: a logo, a name and a route root. Everything that reads the registry
 * then treats the console like a module — the brand in the top-left corner,
 * the tab title and favicon, the per-tab navigation memory — without a special
 * case anywhere.
 *
 * The app launcher is the one reader that must NOT pick it up from here: it
 * lists the active modules' apps, and the console is no module, so the
 * launcher grafts it separately, only for a user allowed to enter it.
 *
 * Registered during render (a map write, idempotent) rather than in an effect,
 * so that readers rendering in the same pass — and effects of children, which
 * run before the parent's — already see it. Re-run when the language changes,
 * as the name is translated.
 */
export declare function useAdminConsoleApp(): void;
