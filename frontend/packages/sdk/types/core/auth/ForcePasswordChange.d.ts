/**
 * Full-screen, non-dismissible password change.
 *
 * Rendered in place of the whole authenticated shell while the current account
 * carries `must_change_password` (an administrator seeded with the built-in
 * default password). There is no close affordance and no route behind it: the
 * only ways out are changing the password or signing out. The server enforces
 * the same rule independently — administrative writes answer
 * `PASSWORD_CHANGE_REQUIRED` until the flag is cleared.
 */
export default function ForcePasswordChange(): import("react").JSX.Element;
