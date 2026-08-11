import type { AudienceMember } from './api';
export default function MemberPicker({ already, busy, error, onAdd, onCancel, }: {
    already: AudienceMember[];
    busy: boolean;
    error?: string;
    onAdd: (members: {
        member_type: string;
        member_id: string;
    }[]) => void;
    onCancel: () => void;
}): import("react").JSX.Element;
