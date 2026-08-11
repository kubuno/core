import { type Privilege, type Role } from '../../authz/types';
export declare function RoleIcon({ role, size }: {
    role: Role;
    size?: number;
}): import("react").JSX.Element;
/** "Delegable to a unit" / "instance only" — the fact that drives the assignment. */
export declare function DelegabilityChip({ role }: {
    role: Role;
}): import("react").JSX.Element;
export default function RolesList({ roles, catalogue, loading, error, onRetry, }: {
    roles: Role[];
    catalogue: Privilege[];
    loading: boolean;
    error?: string;
    onRetry?: () => void;
}): import("react").JSX.Element;
