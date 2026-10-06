import type { OrgUnit } from '../../types';
export type ScopeType = 'default' | 'instance' | 'org_unit' | 'group' | 'user';
export interface SettingOrigin {
    scope_type: ScopeType;
    scope_id: string | null;
    scope_name: string | null;
}
export interface OverrideRef {
    scope_type: Exclude<ScopeType, 'default' | 'instance'>;
    scope_id: string;
    scope_name: string;
    locked: boolean;
}
export interface ResolvedSetting {
    key: string;
    category: string;
    label: string | null;
    description: string | null;
    is_public: boolean;
    value_type: string | null;
    allowed_values: unknown[] | null;
    module_id: string | null;
    default_value: unknown;
    declared_scope: string;
    /** The value that actually applies at the requested scope. */
    value: unknown;
    source: SettingOrigin | null;
    /** True when this scope holds its own row. */
    has_own_value: boolean;
    /** What "revert to the inherited value" would restore. */
    inherited_value: unknown;
    inherited_source: SettingOrigin | null;
    /** A level ABOVE this one locked the key: the control is read-only here. */
    locked_above: boolean;
    /** This very level holds the lock, for the levels below it. */
    locked_here: boolean;
    lock_source: SettingOrigin | null;
    can_override: boolean;
    /** Scopes below the instance that override the key. Instance scope only. */
    overrides: OverrideRef[];
}
export interface ResolvedSettingsResponse {
    scope: {
        scope_type: ScopeType;
        scope_id: string | null;
    };
    settings: ResolvedSetting[];
}
export interface ChainLevel {
    scope_type: ScopeType;
    scope_id: string | null;
    scope_name: string | null;
    value: unknown;
    locked: boolean;
    updated_at: string | null;
    is_winner: boolean;
    is_own: boolean;
}
export interface ChainResponse {
    key: string;
    label: string | null;
    scope: {
        scope_type: ScopeType;
        scope_id: string | null;
    };
    levels: ChainLevel[];
    value: unknown;
    source: SettingOrigin | null;
    overrides: OverrideRef[];
}
/** The scope the settings page is currently showing. */
export interface ActiveScope {
    type: 'instance' | 'org_unit';
    id: string | null;
}
export declare const INSTANCE_SCOPE: ActiveScope;
/** Root-to-unit path, for the breadcrumb above the settings list. */
export declare function orgUnitPath(units: OrgUnit[], id: string | null): OrgUnit[];
