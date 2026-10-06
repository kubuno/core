import type { User } from '../../../../types';
/**
 * Who the account is.
 *
 * Only the displayed name is writable: `PATCH /admin/users/:id` accepts no
 * username and no e-mail, and offering a field the server would ignore is worse
 * than offering none. The other rows stay values, with the hint saying where
 * they do change — which is what an operator otherwise spends a minute looking
 * for in a form that silently drops them.
 */
export default function IdentityCard({ user }: {
    user: User;
}): import("react").JSX.Element;
