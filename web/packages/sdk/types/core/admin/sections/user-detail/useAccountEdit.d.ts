/**
 * The one write of the account sheet.
 *
 * Every editable card sends `PATCH /admin/users/:id` — the audited directory
 * endpoint — through this hook, so there is a single list of the surfaces a
 * change invalidates. Before, each caller kept its own and they had already
 * diverged: the storage page's consumer table went on showing an old ceiling
 * after the directory had raised it.
 *
 * Nothing here decides *what* to send: each card sends only the fields its draft
 * says moved (see [`useDraft`]). An unchanged value echoed back would still be
 * written, and would still produce an audit entry announcing a modification that
 * did not happen.
 */
export declare function useUpdateAccount(userId: string): import("@tanstack/react-query").UseMutationResult<{
    user: unknown;
}, Error, Record<string, unknown>, unknown>;
/**
 * The sentence the server actually sent.
 *
 * Both shapes on purpose: the API client rejects with a FLAT `{ message, code }`
 * (`normalizeError`, api/client.ts), so reading `response.data.message` alone
 * never finds anything and every refusal reads as the same generic fallback.
 */
export declare function accountError(err: unknown): string | undefined;
