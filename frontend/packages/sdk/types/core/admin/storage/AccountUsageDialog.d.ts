import { type Consumer } from './api';
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRIVACY — the hard line this sheet is built around.
 *
 * This sheet shows VOLUMES, OBJECT COUNTS and TECHNICAL CATEGORIES. It must
 * NEVER show a file name, a folder name, a path, a MIME type, an extension or a
 * document title, and no such field may be added to it or to the endpoint it
 * reads. An administrator has to be able to size a server and settle a quota
 * dispute; they must not be able to reconstruct a person's life from the
 * administration console. "How much" is operations. "What" is surveillance.
 *
 * The server sends nothing of the sort today. If it ever does, this component
 * drops it rather than renders it.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ## What the four figures mean, and why they can disagree
 *
 *  * **Counter** — `used_bytes` on the account. The number enforcement reads:
 *    it, and nothing else, decides whether the next upload is refused.
 *  * **Billed by the modules** — what the modules say they charge this account.
 *    Content, bin and versions: what the person can free themselves.
 *  * **Actually held** — everything stored for them, charged or not. Thumbnails,
 *    indexes and caches live here and nowhere else. It is the disk figure.
 *  * **The gap** — counter minus billed, either way round. Both directions are
 *    reported and neither is hidden: bytes counted that no module claims mean a
 *    module went quiet or a deletion was never declared; bytes claimed that were
 *    never counted mean the counter under-reports and the account is writing
 *    past a ceiling it has already passed.
 *
 * `delegated` appears in none of them, on purpose — see `CategoryBreakdown`.
 */
export default function AccountUsageDialog({ account, onClose, onEditQuota, }: {
    account: Consumer;
    onClose: () => void;
    /** Offered only where the caller can actually write the quota. */
    onEditQuota?: () => void;
}): import("react").JSX.Element;
