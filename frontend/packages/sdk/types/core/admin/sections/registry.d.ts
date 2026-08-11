import type { ComponentType } from 'react';
import type { NavigateFunction } from 'react-router-dom';
/**
 * Everything a section may need from the router. Sections that need neither may
 * simply declare no props (a zero-arg component is a valid section component).
 */
export interface AdminSectionProps {
    /**
     * What the address says, as parameters: the query string, PLUS the record and
     * the pane the path carries, republished under the names they had when they
     * were parameters. `/admin/marketplace/drive` reads as `related=drive`,
     * `/admin/users/<id>/security` as `user=<id>&pane=security` — so a section
     * keeps asking `params.get('user')` and never learns where its id is spelt
     * (see `adminRoute.ts`).
     */
    params: URLSearchParams;
    navigate: NavigateFunction;
}
export interface AdminSection {
    Component: ComponentType<AdminSectionProps>;
    /**
     * The section paints its own page header (landing title, breadcrumb…), so
     * AdminPage must NOT prepend the generic `<h1>` of the nav label.
     */
    ownHeader?: boolean;
}
/**
 * Tab id (a navigable leaf of ADMIN_NAV) → section rendered in the module area.
 * A leaf without an entry here falls back to the "coming soon" placeholder when
 * it is flagged `soon: true` in adminNav.ts.
 */
export declare const ADMIN_SECTIONS: Record<string, AdminSection>;
