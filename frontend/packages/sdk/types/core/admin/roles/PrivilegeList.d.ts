import type { Privilege } from '../../authz/types';
export interface PrivilegeGroup {
    domain: string;
    items: Privilege[];
}
/** Buckets keys by domain, in catalogue order, resolving each against `catalogue`. */
export declare function groupPrivileges(keys: string[], catalogue: Privilege[]): PrivilegeGroup[];
export interface PrivilegeListProps {
    /** Keys to render. In the editor this is the whole catalogue. */
    keys: string[];
    catalogue: Privilege[];
    /** Present → checkable editor; absent → read-only display. */
    selected?: Set<string>;
    onToggle?: (key: string) => void;
    /** Bleed the bands to a `px-5` parent's edges, like the surrounding cards. */
    bleed?: boolean;
}
export default function PrivilegeList({ keys, catalogue, selected, onToggle, bleed, }: PrivilegeListProps): import("react").JSX.Element;
