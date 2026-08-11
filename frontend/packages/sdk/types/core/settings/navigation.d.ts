import { type LucideIcon } from 'lucide-react';
export type Tab = 'profile' | 'notifications' | 'themes' | 'clients' | 'security' | 'sessions' | 'api-tokens';
export declare const SETTINGS_NAV: {
    id: Tab;
    labelKey: string;
    defaultLabel: string;
    Icon: LucideIcon;
}[];
/**
 * Section index (mobile only). The section nav lives in the left panel, which on
 * a phone is an off-canvas drawer — so a mobile user landing on /settings would
 * see "Profile" and no hint that six other sections exist. Below `lg`, /settings
 * (with no ?tab=) becomes a plain list of sections, and picking one drills into
 * it with a back row. Same URLs, so links and the desktop layout are untouched.
 */
export declare function MobileSettingsIndex(): import("react").JSX.Element;
