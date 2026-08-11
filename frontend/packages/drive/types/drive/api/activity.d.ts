import type { ActivityEntry, ActivityFeedEntry, InfoExtra } from './types';
/** Activity trails and the extra info shown in the details panel. */
export declare const activityApi: {
    getFileActivity: (id: string) => Promise<{
        activities: ActivityEntry[];
    }>;
    getFolderActivity: (id: string) => Promise<{
        activities: ActivityEntry[];
    }>;
    /** Account-wide activity (Drive home, "Activity" tab). */
    getUserActivity: (limit?: number) => Promise<ActivityFeedEntry[]>;
    getFileInfoExtra: (id: string) => Promise<InfoExtra>;
    getFolderInfoExtra: (id: string) => Promise<InfoExtra>;
};
