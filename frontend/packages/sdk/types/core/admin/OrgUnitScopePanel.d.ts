import type { OrgUnit } from '../types';
/**
 * What the accounts list is being asked to show.
 *
 * `descendants` is ours and deliberate: leaving "does a selected unit include
 * its sub-units?" implicit is the ambiguity that makes an operator read an empty
 * unit as a bug, when its three sub-units hold everyone.
 */
export interface OrgUnitScope {
    /** `all` ignores `unitIds`: the listing spans every unit the caller may see. */
    mode: 'all' | 'selected';
    unitIds: string[];
    descendants: boolean;
}
export declare const ALL_UNITS: OrgUnitScope;
interface Props {
    units: OrgUnit[];
    value: OrgUnitScope;
    onChange: (next: OrgUnitScope) => void;
    /** Accounts per unit, own count only — the panel adds nothing up itself. */
    counts?: Record<string, number>;
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}
/**
 * The organisational-unit panel that frames the accounts list.
 *
 * It does NOT navigate: it *scopes*. Everything downstream — the count, the bulk
 * bar, the export — reads the same scope, so what an operator acts on is always
 * what they are looking at. Structural work (create, rename, move, delete) lives
 * on the units page, one link away at the bottom: choosing a perimeter and
 * reshaping the hierarchy are different acts and should not share a surface.
 */
export declare function OrgUnitScopePanel({ units, value, onChange, counts, collapsed, onCollapsedChange, }: Props): import("react").JSX.Element;
export {};
