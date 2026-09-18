import type { ResolvedSetting } from './scopeTypes';
export interface ScopeStatusPillProps {
    /** Resolved state of the setting at the scope on screen. */
    resolved?: ResolvedSetting;
    /** The page is showing an organisational unit rather than the whole instance. */
    scoped: boolean;
    /**
     * The module declared this setting instance-wide: it has no per-unit meaning,
     * and the row is read-only while a unit is selected.
     */
    instanceOnly: boolean;
}
export default function ScopeStatusPill({ resolved, scoped, instanceOnly }: ScopeStatusPillProps): import("react").JSX.Element | null;
