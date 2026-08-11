import type { Privilege } from '../../authz/types';
/**
 * Define a new role: identity, description and its privilege set.
 *
 * A dialog is the right shape here and only here — there is no record yet, so
 * there is nothing to edit in place. Changing an existing role happens on its
 * sheet (`RoleIdentityCard`, `RolePrivilegesCard`), which is where its name,
 * description and privileges are read. This form used to do both, which is how
 * the sheet ended up displaying three things it could not change.
 *
 * Defining a role is super-user-only server-side (whoever writes a role can
 * write themselves a role), so this dialog is only ever opened for one. It shows
 * the delegability verdict live while privileges are picked — the operator finds
 * out that a role has just become instance-only *while choosing*, not two
 * screens later when the assignment is refused.
 */
export default function RoleCreateDialog({ catalogue, onClose, }: {
    catalogue: Privilege[];
    onClose: () => void;
}): import("react").JSX.Element;
