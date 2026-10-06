/**
 * Code-behind of `CreateTokenForm.kbview` (converted from `CreateTokenForm.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import type { TokenScope } from "../../types";
import { ViewBase } from './CreateTokenForm.kbview';
import * as __parts from './CreateTokenForm.parts';
export type CreateTokenFormProps = {
    onCreated: (raw: string) => void;
};
export declare class CreateTokenForm extends ViewBase {
    accessor name: string;
    accessor expiresInDays: string;
    accessor scopes: string[];
    accessor error: string;
    tr: CreateTokenFormStores['t'];
    queryClient: CreateTokenFormStores['queryClient'];
    data: CreateTokenFormStores['data'];
    available: TokenScope[];
    expiryMandatory: boolean;
    create: CreateTokenFormHooks['create'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        queryClient: import("@tanstack/query-core").QueryClient;
        data: NoInfer<{
            scopes: TokenScope[];
            max_ttl_days: number;
        }> | undefined;
        available: TokenScope[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        expiryMandatory: boolean;
        create: import("@tanstack/react-query").UseMutationResult<{
            token: string;
            id: string;
            name: string;
            scopes: string[];
            expires_at: string | null;
            created_at: string;
        }, unknown, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get maxTtlDays(): number;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        expiresInDays: string;
        setExpiresInDays: (value: string | ((prev: string) => string)) => void;
        expiryMandatory: boolean;
        maxTtlDays: number;
    };
    /** A part of the screen still written in React (<TextField> min, max: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_scopes(): boolean;
    /** `<ApiTokenScopePicker>`, rendered by a ReactHost. */
    get ApiTokenScopePicker(): import("react").FunctionComponent<Readonly<import("./ApiTokenScopePicker").ApiTokenScopePickerProps>>;
    get api_token_scope_picker_props(): {
        scopes: TokenScope[];
        selected: string[];
        onChange: (value: string[] | ((prev: string[]) => string[])) => void;
    };
    get show_error(): boolean;
    handleSubmit(e: React.FormEvent): void;
    panel_submit(_sender: unknown, args: EventArgs): void;
    /** `setExpiresInDays` of the TSX: a value, or an update of the previous one. */
    setExpiresInDays(value: string | ((prev: string) => string)): void;
    /** `setScopes` of the TSX: a value, or an update of the previous one. */
    setScopes(value: string[] | ((prev: string[]) => string[])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CreateTokenFormStores = ReturnType<CreateTokenForm['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type CreateTokenFormHooks = ReturnType<CreateTokenForm['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<CreateTokenFormProps>>;
export default _default;
