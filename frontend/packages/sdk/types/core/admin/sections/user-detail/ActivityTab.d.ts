import type { User } from '../../../types';
/**
 * Activity tab — the audit entries that concern this account.
 *
 * ── Why two queries ──────────────────────────────────────────────────────────
 * `GET /admin/audit` filters by `actor_id`, `action`, `target_type`, `outcome`,
 * dates and free text — but NOT by `target_id`. There is therefore no single
 * server-side filter that returns "everything about this account", so the tab
 * combines the two narrowings the route does support:
 *
 *   • `actor_id=<id>`                   — exact: what this account DID;
 *   • `target_type=user&q=<email>`      — what was done TO it. Every entry the
 *     admin handlers write about a user labels its target `"<name> <email>"`,
 *     so the email is a reliable needle.
 *
 * Both results are then filtered EXACTLY on `target_id === id || actor_id === id`
 * before display: `q` is a substring match and could otherwise drag in a
 * homonym. Adding `target_id` to the route would collapse this to one call.
 */
export default function ActivityTab({ user }: {
    user: User;
}): import("react").JSX.Element;
