import { type Campaign, type MigrationService } from './api';
export default function CampaignWizard({ services, onClose, onCreated, }: {
    services: MigrationService[];
    onClose: () => void;
    onCreated: (campaign: Campaign) => void;
}): import("react").JSX.Element;
