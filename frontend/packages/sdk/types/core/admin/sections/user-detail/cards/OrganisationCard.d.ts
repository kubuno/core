import type { User } from '../../../../types';
/**
 * Where the account sits, and what it is.
 *
 * The three rows do not share one privilege, and the card says so field by field
 * rather than as a whole:
 *
 * - **Role** is instance super-administration when it reads `admin`, so the
 *   server demands a super-user (`require_superuser`, `update_user`). Anyone
 *   else reads the badge.
 * - **Unit** needs `users.update` over both the unit the account is in *and* the
 *   one it is going to — the server checks both perimeters, and a delegated
 *   administrator must not be able to push accounts out of their own subtree.
 * - **Status** is a verb, not a field: it stays the confirmed action in the
 *   sheet header, where it cannot be flipped by a stray click inside a form.
 */
export default function OrganisationCard({ user }: {
    user: User;
}): import("react").JSX.Element;
