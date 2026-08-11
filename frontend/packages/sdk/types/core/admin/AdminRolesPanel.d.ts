/**
 * Delegated administration: roles, their privileges and their assignments —
 * all of it server-backed (`/admin/roles`, `/admin/privileges`,
 * `/admin/role-assignments`). `/admin/admin-roles/<uuid>` opens one role's sheet.
 *
 * The catalogue is fetched alongside the roles because a role only carries
 * privilege *keys*: labels, orphan status and — the fact this whole screen turns
 * on — scopability, all live in the catalogue.
 */
export default function AdminRolesPanel(): import("react").JSX.Element;
