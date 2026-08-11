import type { CreateShareOptions, Recipient, Share } from './types';
/** Shares: public links, per-recipient access and revocation. */
export declare const shareApi: {
    listShares: () => Promise<{
        shares: Share[];
    }>;
    createShare: (opts: CreateShareOptions) => Promise<{
        share: Share;
    }>;
    searchRecipients: (q: string, limit?: number) => Promise<Recipient[]>;
    revokeShare: (id: string) => Promise<void>;
    revokeAccess: (shareId: string) => Promise<void>;
};
