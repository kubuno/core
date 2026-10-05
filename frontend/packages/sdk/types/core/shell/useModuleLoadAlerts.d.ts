/**
 * Turns a module whose UI bundle failed to load into a bell notification.
 *
 * ── Why this hook exists ─────────────────────────────────────────────────────
 * The runtime loader isolates a broken module so it never takes down the shell,
 * but that isolation used to be *total silence*: the module simply vanished from
 * the sidebar and the waffle, and the only trace was a `console.error` nobody
 * reads. A module built against a newer SDK surface than the host serves — a
 * removed re-export, say — would disappear with no visible cause. This hook is
 * the visible cause: it feeds the same header bell the alert centre uses, so an
 * operator learns a module is down without opening the devtools.
 *
 * ── The rules it respects (same as `useAlertFeed`) ───────────────────────────
 * * **Only holders of `core.modules.read` are told.** A failed UI bundle is an
 *   operator's problem; an ordinary user can do nothing with the news.
 * * **Announced once per module.** `pushKeyed` is keyed on the module id, so a
 *   list re-fetched on every WebSocket module event does not re-cry the same
 *   failure — including after the reader dismissed it.
 * * **Recovery is silent.** When a later attempt loads the module, the loader
 *   clears its failure; the already-shown notification simply stops being
 *   re-announced. (An acknowledged bell row is the reader's to dismiss.)
 */
export declare function useModuleLoadAlerts(): void;
