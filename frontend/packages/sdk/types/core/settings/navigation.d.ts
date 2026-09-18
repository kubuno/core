import { type LucideIcon } from 'lucide-react';
import { type MeFeatures } from '../store/authStore';
export type Tab = 'profile' | 'notifications' | 'themes' | 'clients' | 'security' | 'sessions' | 'api-tokens' | 'my-data';
interface NavItem {
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
/**
 * Section index (mobile only). The section nav lives in the left panel, which on
 * a phone is an off-canvas drawer — so a mobile user landing on /settings would
 * see "Profile" and no hint that six other sections exist. Below `lg`, /settings
 * (with no ?tab=) becomes a plain list of sections, and picking one drills into
 * it with a back row. Same URLs, so links and the desktop layout are untouched.
 */
export declare function MobileSettingsIndex(): import("react").JSX.Element;
export {};
