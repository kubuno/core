import ConfirmDialog from "@ui/ConfirmDialog";
import { ViewBase } from './OAuthProvidersPanel.kbview';
import * as __parts from './OAuthProvidersPanel.parts';
interface AdminProvider {
    id: string;
    slug: string;
    display_name: string;
    issuer_url: string;
    client_id: string;
    has_secret: boolean;
    scopes: string;
    button_color: string | null;
    enabled: boolean;
    allow_signup: boolean;
    position: number;
    claim_username: string;
    claim_email: string;
    claim_display_name: string;
    claim_groups: string;
    sync_groups: boolean;
}
interface DiscoveryProbe {
    ok: boolean;
    message: string;
    detail?: string;
    hint?: string;
    issuer_url: string;
    authorization_endpoint?: string;
    token_endpoint?: string;
    userinfo_endpoint?: string;
    elapsed_ms: number;
}
interface FormState {
    slug: string;
    display_name: string;
    issuer_url: string;
    client_id: string;
    client_secret: string;
    scopes: string;
    button_color: string;
    enabled: boolean;
    allow_signup: boolean;
    claim_username: string;
    claim_email: string;
    claim_display_name: string;
    claim_groups: string;
    sync_groups: boolean;
}
export declare class OAuthProvidersPanel extends ViewBase {
    accessor editing: string | null;
    accessor probe: Record<string, DiscoveryProbe>;
    qc: OAuthProvidersPanelStores['qc'];
    confirm: OAuthProvidersPanelStores['confirm'];
    confirmState: OAuthProvidersPanelStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    providers: OAuthProvidersPanelStores['providers'];
    isLoading: boolean;
    createM: OAuthProvidersPanelHooks['createM'];
    updateM: OAuthProvidersPanelHooks['updateM'];
    deleteM: OAuthProvidersPanelHooks['deleteM'];
    testM: OAuthProvidersPanelHooks['testM'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        qc: import("@tanstack/query-core").QueryClient;
        confirm: (options: import("@ui/ConfirmDialog").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        providers: NoInfer<AdminProvider[]> | undefined;
        isLoading: boolean;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        createM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, FormState, unknown>;
        updateM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, {
            id: string;
            data: Partial<FormState>;
        }, unknown>;
        deleteM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
        testM: import("@tanstack/react-query").UseMutationResult<DiscoveryProbe, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_editing(): boolean;
    get part1_props(): {
        setEditing: (value: string | null | ((prev: string | null) => string | null)) => void;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get show_editing_new(): boolean;
    /** `<ProviderForm>`, rendered by a ReactHost. */
    get ProviderForm(): typeof __parts.ProviderForm;
    get provider_form_props(): {
        initial: __parts.FormState;
        isEdit: boolean;
        onSave: (data: __parts.FormState) => void;
        onCancel: () => void;
    };
    get show_not_is_loading(): boolean;
    get show_providers_editing_new(): boolean;
    get show_not_providers_editing_new(): boolean;
    get part2_props(): {
        providers: NoInfer<AdminProvider[]> | undefined;
        editing: string | null;
        toFormState: (p: AdminProvider) => FormState;
        submit: (data: FormState) => void;
        setEditing: (value: string | null | ((prev: string | null) => string | null)) => void;
        testM: import("@tanstack/react-query").UseMutationResult<DiscoveryProbe, Error, string, unknown>;
        updateM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, {
            id: string;
            data: Partial<FormState>;
        }, unknown>;
        onDelete: (p: AdminProvider) => Promise<void>;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part2(): typeof __parts.Part2;
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part3(): typeof __parts.Part3;
    /** The rows of the Repeater over `providers?.filter((p) => probe[p.id])`. */
    get rows_items(): {
        p: AdminProvider;
        r: DiscoveryProbe;
        part3_props: {
            p: AdminProvider;
            r: DiscoveryProbe;
            r_authorization_endpoint: string | undefined;
            r_detail: string | undefined;
            r_hint: string | undefined;
        } | undefined;
        key: string;
    }[] | undefined;
    get visible(): boolean;
    get visible2(): boolean;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof ConfirmDialog;
    get confirm_dialog_props(): {
        onConfirm: () => void;
        onCancel: () => void;
        resolve: (ok: boolean) => void;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: import("@ui/ConfirmDialog").ConfirmVariant;
        hideCancel?: boolean;
    };
    invalidate_(): void;
    toFormState(p: AdminProvider): FormState;
    submit(data: FormState): void;
    onDelete(p: AdminProvider): Promise<void>;
    /** `setEditing` of the TSX: a value, or an update of the previous one. */
    setEditing(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OAuthProvidersPanelStores = ReturnType<OAuthProvidersPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type OAuthProvidersPanelHooks = ReturnType<OAuthProvidersPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
