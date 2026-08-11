import { type ResourceFeature } from './api';
export default function FeatureDialog({ feature, onClose, }: {
    feature: ResourceFeature | null;
    onClose: () => void;
}): import("react").JSX.Element;
