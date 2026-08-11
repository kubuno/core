import { type Resource } from './api';
export default function ResourceDialog({ resource, onClose, }: {
    resource: Resource | null;
    onClose: () => void;
}): import("react").JSX.Element;
