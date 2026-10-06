import { type LucideIcon } from 'lucide-react';
import { type MeFeatures } from '../store/authStore';
export type Tab = 'profile' | 'notifications' | 'themes' | 'clients' | 'security' | 'sessions' | 'api-tokens' | 'my-data';
export interface NavItem {
    id: Tab;
    labelKey: string;
    defaultLabel: string;
    Icon: LucideIcon;
    /**
     * Feature switch of `/me` this section depends on. A section carrying one does
     * not exist for an account the switch is off for: it is absent from the panel,
     * from the mobile index and from the page — never present and disabled. A
     * greyed control is an invitation to ask why; an absent one is an answer.
     */
    feature?: keyof MeFeatures;
}
export declare const SETTINGS_NAV: NavItem[];
/**
 * The sections this account actually has, in paint order.
 *
 * The single source the three consumers share — panel, mobile index and page
 * title. Filtering in one place is what makes "the function disappears" true
 * rather than true in two places out of three.
 */
export declare function useSettingsNav(): NavItem[];
