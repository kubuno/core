import { type MigrationAccount } from "./api";
import type { CampaignDetail } from './CampaignDetail';
declare function StatusChip({ status }: {
    status: MigrationAccount['status'];
}): import("react").JSX.Element;
export { StatusChip };
export declare function Part1({ pause, campaignId, toast, t }: {
    pause: NonNullable<CampaignDetail['pause']>;
    campaignId: NonNullable<CampaignDetail['props']['campaignId']>;
    toast: NonNullable<CampaignDetail['toast']>;
    t: NonNullable<CampaignDetail['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ start, campaignId, toast, t, campaign }: {
    start: NonNullable<CampaignDetail['start']>;
    campaignId: NonNullable<CampaignDetail['props']['campaignId']>;
    toast: NonNullable<CampaignDetail['toast']>;
    t: NonNullable<CampaignDetail['tr']>;
    campaign: NonNullable<CampaignDetail['campaign']>;
}): import("react").JSX.Element;
export declare function Part3({ confirm, t, campaign, remove, campaignId, toast, onGone }: {
    confirm: NonNullable<CampaignDetail['confirm']>;
    t: NonNullable<CampaignDetail['tr']>;
    campaign: NonNullable<CampaignDetail['campaign']>;
    remove: NonNullable<CampaignDetail['remove']>;
    campaignId: NonNullable<CampaignDetail['props']['campaignId']>;
    toast: NonNullable<CampaignDetail['toast']>;
    onGone: NonNullable<CampaignDetail['props']['onGone']>;
}): import("react").JSX.Element;
export declare function Part4({ t, accounts, columns, isError, refetch }: {
    t: NonNullable<CampaignDetail['tr']>;
    accounts: NonNullable<CampaignDetail['accounts']>;
    columns: NonNullable<CampaignDetail['columns']>;
    isError: NonNullable<CampaignDetail['isError']>;
    refetch: NonNullable<CampaignDetail['refetch']>;
}): import("react").JSX.Element;
