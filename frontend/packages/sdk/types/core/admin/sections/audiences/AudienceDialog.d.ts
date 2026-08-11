export default function AudienceDialog({ busy, error, onSave, onCancel, }: {
    busy: boolean;
    error?: string;
    onSave: (v: {
        name: string;
        description: string | null;
    }) => void;
    onCancel: () => void;
}): import("react").JSX.Element;
