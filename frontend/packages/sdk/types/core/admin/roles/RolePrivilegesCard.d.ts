import type { Privilege, Role } from '../../authz/types';
/**
 * What the role grants — picked where it is read.
 *
 * The delegability verdict is recomputed live while privileges are ticked, so an
 * operator finds out that a role has just become instance-only *while choosing*,
 * not two screens later when an assignment is refused. That live warning is the
 * reason the picker cannot simply be a read-only list with a pencil beside it.
 *
 * Two cases carry no pencil at all, and both are refusals the server would issue
 * anyway: a super-user role holds everything present and future — there is no
 * set to pick — and a system role's set is frozen (`PATCH /admin/roles/:id`
 * refuses a `privileges` field on one, even an identical set).
 */
export default function RolePrivilegesCard({ role, catalogue, canEdit, }: {
    role: Role;
    catalogue: Privilege[];
    canEdit: boolean;
}): import("react").JSX.Element;
