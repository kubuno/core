import type { User } from '../../../types';
/**
 * "This password is suspect" — deliberately not the same control as
 * `PasswordResetCard`, which says "this password is gone".
 *
 * Arming the flag alone leaves the account signed in and its password working
 * exactly once more; the next sign-in ends on the forced-change screen, and
 * every write stays closed until the person picks a new password. An
 * administrator who suspects a password was shared over a chat does not want to
 * invent one, phone the person and dictate it — which is what the reset makes
 * them do.
 *
 * The card also states when the current password was chosen. Without that date
 * the expiry policy is an abstraction: an operator looking at an account cannot
 * tell whether it is about to be renewed or was renewed yesterday.
 */
export default function RequirePasswordChangeCard({ user }: {
    user: User;
}): import("react").JSX.Element;
