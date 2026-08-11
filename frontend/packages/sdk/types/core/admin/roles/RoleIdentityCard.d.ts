import type { Role } from '../../authz/types';
/**
 * What the role is called and what it says it does.
 *
 * The wording shown is the operator's own — `useAuthzLabels` translates the
 * built-in roles — and that is exactly why only a touched field is sent: opening
 * this card in English and saving a description must not freeze a system role's
 * name into English for every other reader. `useDraft` compares against the
 * label currently displayed, so an untouched name is simply absent from the
 * `PATCH` and the stored row goes on being translated.
 *
 * The slug is shown and never editable: it is the identifier assignments and
 * policies are written against, and the server refuses to change it after
 * creation.
 */
export default function RoleIdentityCard({ role, canEdit, actions, }: {
    role: Role;
    /** Defining a role is super-user-only server-side (guard 1). */
    canEdit: boolean;
    /** The sheet's own verbs, kept in the header in both states. */
    actions?: React.ReactNode;
}): import("react").JSX.Element;
