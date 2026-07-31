export default function OrgUnitPicker({ title, currentId, excludeId, onSelect, onClose, }: {
    title: string;
    currentId: string | null;
    excludeId?: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}): import("react").JSX.Element;
