/**
 * Code-behind of `ApiTokensTab.kbview` (converted from `ApiTokensTab.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { ApiToken } from "../../types";
import { ViewBase } from './ApiTokensTab.kbview';
import * as __parts from './ApiTokensTab.parts';
export declare class ApiTokensTab extends ViewBase {
    accessor newToken: string | null;
    tr: ApiTokensTabStores['t'];
    tokens: ApiTokensTabStores['tokens'];
    isLoading: boolean;
    revoke: ApiTokensTabStores['revoke'];
    legacy: ApiToken[];
    soonest: string;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        queryClient: import("@tanstack/query-core").QueryClient;
        tokens: NoInfer<ApiToken[]> | undefined;
        isLoading: boolean;
        revoke: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
        legacy: ApiToken[];
        soonest: string;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_new_token(): boolean;
    /** `<NewTokenBanner>`, rendered by a ReactHost. */
    get NewTokenBanner(): import("react").FunctionComponent<Readonly<import("./NewTokenBanner").NewTokenBannerProps>>;
    get new_token_banner_props(): Readonly<import("./NewTokenBanner").NewTokenBannerProps>;
    get show_legacy(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        soonest: string;
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part1(): typeof __parts.Part1;
    /** `<CreateTokenForm>`, rendered by a ReactHost. */
    get CreateTokenForm(): import("react").FunctionComponent<Readonly<import("./CreateTokenForm").CreateTokenFormProps>>;
    get create_token_form_props(): {
        onCreated: (value: string | null | ((prev: string | null) => string | null)) => void;
    };
    get show_tokens_tokens(): boolean;
    get show_tokens_tokens2(): boolean;
    /** A part of the screen still written in React (an icon with a computed className). */
    get Part2(): typeof __parts.Part2;
    /** `<TokenScopeList>`, rendered by a ReactHost. */
    get TokenScopeList(): import("react").FunctionComponent<Readonly<import("./TokenScopeList").TokenScopeListProps>>;
    /** The rows of the Repeater over `tokens`. */
    get rows_tokens(): {
        tok: ApiToken;
        isExpired: boolean;
        graceOver: boolean;
        div_class: string | undefined;
        part2_props: {
            isExpired: boolean;
            graceOver: boolean;
        } | undefined;
        text: string | undefined;
        show_tok_last_used: boolean | undefined;
        text2: string | undefined;
        show_tok_last_used2: boolean | undefined;
        show_tok_expires_at: boolean | undefined;
        show_not_tok_expires_at: boolean | undefined;
        span_class: string | undefined;
        span_text: string | undefined;
        token_scope_list_props: {
            scopes: string[];
        } | undefined;
        show_tok_is_legacy: boolean | undefined;
        p_text: string | undefined;
        key: string;
    }[];
    panel_click(_sender: unknown, args: MouseEventArgs): undefined;
    /** `setNewToken` of the TSX: a value, or an update of the previous one. */
    setNewToken(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ApiTokensTabStores = ReturnType<ApiTokensTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
