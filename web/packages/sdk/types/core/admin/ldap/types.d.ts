/**
 * Wire shapes of `/admin/ldap/*`.
 *
 * `has_bind_password` rather than the password: the API never returns it, so
 * there is nothing to prefill and the form's password field starts empty on
 * every load. Sending it back is what would leak it.
 */
export interface LdapDirectory {
    id: string;
    slug: string;
    display_name: string;
    enabled: boolean;
    host: string;
    port: number;
    security: 'none' | 'starttls' | 'ldaps';
    verify_certificate: boolean;
    ca_certificate: string;
    connect_timeout_s: number;
    bind_dn: string;
    has_bind_password: boolean;
    base_dn: string;
    user_filter: string;
    user_scope: 'base' | 'onelevel' | 'subtree';
    attr_username: string;
    attr_email: string;
    attr_display_name: string;
    attr_unique_id: string;
    attr_member_of: string;
    sync_groups: boolean;
    group_base_dn: string;
    group_filter: string;
    attr_group_name: string;
    attr_group_member: string;
    sync_enabled: boolean;
    sync_interval_min: number;
    on_missing: 'disable' | 'ignore';
    allow_signup: boolean;
    last_sync_at: string | null;
    last_sync_status: 'ok' | 'partial' | 'failed' | null;
    last_sync_detail: string | null;
    default_org_unit_id: string | null;
    position: number;
    usable: boolean;
    governed_accounts: number;
}
export interface SampleMapping {
    username: string | null;
    email: string | null;
    display_name: string | null;
    has_unique_id: boolean;
    groups: number;
}
export interface ConnectionProbe {
    ok: boolean;
    message: string;
    detail?: string | null;
    hint?: string | null;
    host: string;
    port: number;
    security: string;
    unverified_tls: boolean;
    entries: number | null;
    sample_dn: string | null;
    sample_mapping: SampleMapping | null;
    elapsed_ms: number;
}
export interface AuthProbe {
    ok: boolean;
    message: string;
    detail?: string | null;
    hint?: string | null;
    login: string;
    dn: string | null;
    sample_mapping: SampleMapping | null;
    would_provision: string | null;
    elapsed_ms: number;
}
export interface SyncReport {
    directory: string;
    users_seen: number;
    users_created: number;
    users_linked: number;
    users_matched: number;
    users_skipped: number;
    groups_seen: number;
    groups_created: number;
    memberships_added: number;
    memberships_removed: number;
    disabled: number;
    disable_refused: string | null;
    warnings: string[];
    status: 'ok' | 'partial' | 'failed';
    elapsed_ms: number;
}
/** The form. `bind_password` is write-only and starts empty on every load. */
export interface DirectoryForm {
    slug: string;
    display_name: string;
    enabled: boolean;
    host: string;
    port: string;
    security: string;
    verify_certificate: boolean;
    ca_certificate: string;
    connect_timeout_s: string;
    bind_dn: string;
    bind_password: string;
    base_dn: string;
    user_filter: string;
    user_scope: string;
    attr_username: string;
    attr_email: string;
    attr_display_name: string;
    attr_unique_id: string;
    attr_member_of: string;
    sync_groups: boolean;
    group_base_dn: string;
    group_filter: string;
    attr_group_name: string;
    attr_group_member: string;
    sync_enabled: boolean;
    sync_interval_min: string;
    on_missing: string;
    allow_signup: boolean;
    default_org_unit_id: string | null;
}
/**
 * The two attribute presets, mirroring `directory::model::AttributeMap`.
 *
 * They differ on every line that matters, which is exactly why a preset is
 * worth having: an operator pointing Kubuno at Active Directory with the
 * standard names gets a connection that works and a search that finds nobody.
 */
export declare const PRESETS: Record<'standard' | 'ad', Partial<DirectoryForm>>;
export declare const emptyForm: () => DirectoryForm;
export declare const toForm: (d: LdapDirectory) => DirectoryForm;
/** Ports that go with each transport mode, applied when switching mode while
 *  the current port is still the default of the previous one. */
export declare const DEFAULT_PORT: Record<string, string>;
export declare const IS_DEFAULT_PORT: (port: string) => port is "389" | "636";
