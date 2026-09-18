import { type MyExportOverview } from './api';
/**
 * Step 3 — following the request, and fetching the archive.
 *
 * ## Everything on screen is a fact the server resolved
 *
 * `downloadable` and `downloads_left` are computed server-side and simply
 * displayed: a browser deriving them from `available_at`, `expires_at` and two
 * counters would eventually disagree with the route that enforces them, and the
 * disagreement always surfaces as a button that fails.
 *
 * ## Why there is no "cancel"
 *
 * One request at a time per account, and a personal archive takes minutes rather
 * than hours. A cancel button would exist to undo a mistaken selection, and its
 * cost — a second write path into a run the producer is walking through — is out
 * of proportion with waiting for a small export to finish.
 */
export interface RequestStatusProps {
    data: MyExportOverview;
    locale: string;
    /** Start a new request: shown once nothing is under way. */
    onRestart: () => void;
}
export default function RequestStatus({ data, locale, onRestart }: RequestStatusProps): import("react").JSX.Element;
