import type { User } from '../../../../types';
/**
 * The account's ceiling, edited where it is read.
 *
 * `QuotaField` is the storage page's own control, borrowed rather than
 * re-implemented: a byte count is the thing an operator gets wrong —
 * `53687091200` and `5368709120` differ by one character and by a factor of ten
 * — and the two screens that set a quota must not disagree about how it is
 * typed. It also replaces the 0–200 Go slider the edit window used, which could
 * not express the ceiling of an account already above 200 Go.
 *
 * Lowering below current usage is allowed — it is a legitimate way to stop
 * growth — and warned about rather than refused, exactly as on the storage page.
 */
export default function StorageCard({ user }: {
    user: User;
}): import("react").JSX.Element;
