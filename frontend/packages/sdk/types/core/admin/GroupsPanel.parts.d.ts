import type { UserGroup } from "../types";
declare function PermBadge({ perm }: {
    perm: string;
}): import("react").JSX.Element;
export { PermBadge };
declare function GroupForm({ initial, onSave, onCancel, }: {
    initial?: Partial<UserGroup>;
    onSave: (data: {
        name: string;
        description: string;
        permissions: string[];
        is_default: boolean;
        release_exempt: boolean;
    }) => void;
    onCancel: () => void;
}): import("react").JSX.Element;
export { GroupForm };
declare function GroupRow({ group, onDeleted }: {
    group: UserGroup & {
        member_count: number;
    };
    onDeleted: () => void;
}): import("react").JSX.Element;
export { GroupRow };
