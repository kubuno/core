import { type Privilege, type Role } from '../../authz/types';
/**
 * One role's sheet: what it grants, and who currently holds it over what.
 *
 * "Modifier le rôle" used to open the creation form as a window over this sheet
 * — the same name, the same description and the same privilege list the sheet
 * was already showing, in a second markup that was one change away from
 * disagreeing with the first. Both are now edited in the card that displays
 * them; `RoleEditorDialog` has become `RoleCreateDialog`, which is all it should
 * ever have been.
 */
export default function RoleDetail({ role, catalogue, }: {
    role: Role;
    catalogue: Privilege[];
}): import("react").JSX.Element;
