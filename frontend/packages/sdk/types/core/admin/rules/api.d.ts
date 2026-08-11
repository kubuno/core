import type { BacktestRow, Catalog, ExecutionRow, Mode, Rule, RuleInput, RulesListResponse, VersionRow } from './types';
export declare const RULES_KEY: readonly ["admin-rules"];
export declare const CATALOG_KEY: readonly ["admin-rules-catalog"];
export declare const EXEC_KEY: readonly ["admin-rules-executions"];
/**
 * The catalogue: every trigger, every action, the closed operator vocabulary,
 * the settable modes and the ceilings. Everything the editor offers is derived
 * from this — nothing is hard-coded in the frontend.
 */
export declare function useRuleCatalog(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<Catalog>, Error>;
export declare function useRules(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<RulesListResponse>, Error>;
interface RuleDetail {
    rule: Rule;
    versions: VersionRow[];
    backtests: BacktestRow[];
}
export declare function useRule(id: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<RuleDetail>, Error>;
export declare function useCreateRule(): import("@tanstack/react-query").UseMutationResult<Rule, Error, RuleInput, unknown>;
export declare function useUpdateRule(): import("@tanstack/react-query").UseMutationResult<Rule, Error, {
    id: string;
    input: RuleInput;
}, unknown>;
/**
 * The one-click arm/disarm. Server-side it goes through the same validation and
 * the same versioning as a full edit, because "which version acted" must stay
 * answerable and the mode is part of what a version means.
 */
export declare function useSetRuleMode(): import("@tanstack/react-query").UseMutationResult<Rule, Error, {
    id: string;
    mode: Mode;
    change_note?: string;
}, unknown>;
export declare function useDeleteRule(): import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
export interface ExecutionFilters {
    rule_id?: string;
    mode?: string;
    outcome?: string;
    limit?: number;
}
export declare function useExecutions(filters: ExecutionFilters, enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<ExecutionRow[]>, Error>;
export declare function useStartBacktest(): import("@tanstack/react-query").UseMutationResult<BacktestRow, Error, {
    id: string;
    from?: string;
    to?: string;
}, unknown>;
/**
 * Polls one replay until it settles.
 *
 * The replay runs in the job queue, not in the request: a month of events cannot
 * hold an HTTP call open — or die with it. So the console asks again until the
 * row says `done` or `failed`, and stops.
 */
export declare function useBacktest(ruleId: string | null, backtestId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<BacktestRow>, Error>;
export interface OrgUnitRow {
    id: string;
    name: string;
    parent_id: string | null;
}
export interface GroupRow {
    id: string;
    name: string;
    member_count: number;
}
export interface UserRow {
    id: string;
    username: string;
    email: string;
    display_name: string | null;
    org_unit_id: string | null;
}
/**
 * The directory the scope editor names things from.
 *
 * `retry: false` on purpose: an operator holding `core.rules.read` but not
 * `core.users.read` legitimately gets a 403 here, and the editor degrades to
 * showing raw identifiers rather than retrying a refusal three times.
 */
export declare function useOrgUnits(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<OrgUnitRow[]>, Error>;
export declare function useGroupsLite(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<GroupRow[]>, Error>;
/**
 * A page of accounts, used for the scope preview.
 *
 * Deliberately capped: the server offers no "count the accounts this scope
 * covers" endpoint, so the console computes over what it loaded and SAYS so
 * rather than presenting a partial count as a measurement.
 */
export declare function useUsersLite(enabled?: boolean, limit?: number): import("@tanstack/react-query").UseQueryResult<NoInfer<{
    users: UserRow[];
    total: number;
}>, Error>;
export declare function useGroupMembers(ids: string[], enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<Record<string, string[]>>, Error>;
export {};
