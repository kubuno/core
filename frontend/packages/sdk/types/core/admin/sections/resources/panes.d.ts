/**
 * The four screens of the section, and the query-string value each one carries.
 *
 * A module of its own so that a child screen can link to a sibling without
 * importing the parent that renders it — `OverviewTab` sends the operator to the
 * buildings list, and a cycle there would be a bundling accident waiting to
 * happen.
 */
export type ResourcePane = 'overview' | 'buildings' | 'resources' | 'features';
export declare const RESOURCE_PANES: ResourcePane[];
/** Reads the pane out of `/admin/resources?pane=…`, defaulting to the landing. */
export declare function paneFromParams(params: URLSearchParams): ResourcePane;
