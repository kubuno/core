import type { TokenScope } from '../../types';
/**
 * Scope selector for a new API token.
 *
 * A tree by functional group rather than a flat list: the catalogue is already
 * around thirty entries and grows with every module that declares its own, and
 * "what can this key touch" is a question about subjects (accounts, settings,
 * modules), not about an alphabetical list of dotted strings.
 *
 * The list is whatever `GET /me/api-tokens/scopes` returned, which is exactly
 * what the creator holds at that instant — so the picker cannot offer a choice
 * the server will refuse. Nothing is pre-selected: there is no "all" default, and
 * offering one would quietly recreate the credential this work exists to remove.
 *
 * Scopes are privileges, so their wording goes through `useAuthzLabels`: the
 * core's translation for its own catalogue, the stored label for whatever a
 * module declared.
 */
export declare function ApiTokenScopePicker({ scopes, selected, onChange, }: {
    scopes: TokenScope[];
    selected: string[];
    onChange: (keys: string[]) => void;
}): import("react").JSX.Element;
/** Read-only rendering of a token's scopes, for the listing. */
export declare function TokenScopeList({ scopes }: {
    scopes: string[];
}): import("react").JSX.Element;
