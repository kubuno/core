import type { User } from '../../../types';
/**
 * Administrator-driven password reset, inside the account's Security tab.
 *
 * The card owns nothing but the open/closed state: `ResetPasswordDialog` runs
 * its own request and its own two-step flow (form → outcome). `onDone` is not a
 * close signal — it fires once the reset succeeded, which is when the account's
 * `must_change_password` flag and its session list have both changed server-side
 * and must be refetched here.
 */
export default function PasswordResetCard({ user }: {
    user: User;
}): import("react").JSX.Element;
