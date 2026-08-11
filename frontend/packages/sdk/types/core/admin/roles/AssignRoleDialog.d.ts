import { type Privilege, type Role } from '../../authz/types';
/**
 * Grant a role to one subject over one scope.
 *
 * ── The decisive point ───────────────────────────────────────────────────────
 * `ou_delegable` is false when the role carries even one privilege that cannot
 * be confined to a subtree. The server refuses such an assignment outright, so
 * the "organisational unit" option is **disabled and explained here**, before
 * anything is composed. Letting the operator pick a unit, choose a subject and
 * submit — only to be told the combination was impossible from the start — is
 * the failure mode this screen exists to avoid.
 */
export default function AssignRoleDialog({ role, catalogue, onClose, }: {
    role: Role;
    catalogue: Privilege[];
    onClose: () => void;
}): import("react").JSX.Element;
