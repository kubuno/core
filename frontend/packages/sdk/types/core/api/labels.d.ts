import type { KubunoDataEnvelope } from '../registry/DataTransferRegistry';
export interface CoreLabel {
    id: string;
    name: string;
    color: string;
    description: string | null;
    /** Links counted under the caller's visibility: everyone's when `can_manage`, else their own. */
    link_count: number;
    /** The caller created this label. */
    is_owner: boolean;
    /** Full co-ownership: rename, recolor, re-share, delete — and see everyone's elements. */
    can_manage: boolean;
    owner_id: string;
    owner_name: string;
    share_count: number;
}
/** One recipient of a label: a named user OR a whole group. */
export interface LabelShare {
    id: string;
    kind: 'user' | 'group';
    user_id: string | null;
    group_id: string | null;
    name: string;
    can_manage: boolean;
}
export interface LabelShareTargets {
    users: {
        id: string;
        name: string;
        avatar_url: string | null;
    }[];
    groups: {
        id: string;
        name: string;
        member_count: number;
    }[];
}
export interface LabelBrowseItem {
    module: string;
    resource_type: string;
    resource_id: string;
    title: string | null;
    href: string | null;
    envelope: KubunoDataEnvelope | null;
    label_ids: string[];
    /** Names of the OTHER members who labelled this element (managers only). */
    other_owners: string[];
}
export interface LabelLink {
    id: string;
    label_id: string;
    module: string;
    resource_type: string;
    resource_id: string;
    title: string | null;
    href: string | null;
    envelope: KubunoDataEnvelope | null;
    created_at: string;
}
export declare const labelsApi: {
    list: () => Promise<CoreLabel[]>;
    create: (name: string, color?: string) => Promise<CoreLabel>;
    update: (id: string, patch: {
        name?: string;
        color?: string;
        description?: string;
    }) => Promise<CoreLabel>;
    remove: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    /** Label ids currently attached to one element. */
    forResource: (resourceType: string, resourceId: string) => Promise<string[]>;
    /** Replaces the label set of one element (atomic picker save). */
    setForResource: (body: {
        module: string;
        resource_type: string;
        resource_id: string;
        title?: string;
        href?: string;
        envelope?: KubunoDataEnvelope;
        label_ids: string[];
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    /** Cross-module browse: AND-filter on labels + text search + module filter. */
    browse: (opts?: {
        labels?: string[];
        q?: string;
        module?: string;
    }) => Promise<LabelBrowseItem[]>;
    links: (labelId: string) => Promise<LabelLink[]>;
    removeLink: (labelId: string, linkId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    /** Current audience of a label (managers only). */
    shares: (labelId: string) => Promise<LabelShare[]>;
    /** Replaces the whole audience in one call (managers only). */
    setShares: (labelId: string, shares: {
        user_id?: string;
        group_id?: string;
        can_manage: boolean;
    }[]) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    /** Users and groups the share picker can offer. */
    shareTargets: (q?: string) => Promise<LabelShareTargets>;
};
