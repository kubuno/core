export default function CampaignDetail({ campaignId, canManage, onGone, }: {
    campaignId: string;
    canManage: boolean;
    /** Called after a removal, so the page can return to the list. */
    onGone: () => void;
}): import("react").JSX.Element;
