import { ViewBase } from './KnownConnectionsCard.kbview';
interface Conn {
    id: string;
    engine: string;
    host: string;
    port: number | null;
    user: string;
    database: string;
    path: string;
    schema_prefix: string | null;
    label: string;
    has_password: boolean;
    is_current: boolean;
    created_at: string;
    last_used_at: string;
    last_synced_at: string | null;
}
interface ConnectionsResponse {
    scope: string;
    connections: Conn[];
}
export type KnownConnectionsCardProps = {
    basePath: string;
    queryKey: (string | undefined)[];
    onChanged?: () => void;
    /** Render the list as a section (no Card chrome), to sit inside a parent card. */
    embedded?: boolean;
    /** Section heading, used in embedded mode. */
    heading?: string;
};
export declare class KnownConnectionsCard extends ViewBase {
    accessor error: string | null;
    accessor busyId: string | null;
    tr: KnownConnectionsCardStores['t'];
    isSuperuser: boolean;
    toast: KnownConnectionsCardStores['toast'];
    qc: KnownConnectionsCardStores['qc'];
    confirm: KnownConnectionsCardStores['confirm'];
    confirmState: KnownConnectionsCardStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    q: KnownConnectionsCardHooks['q'];
    switchMut: KnownConnectionsCardHooks['switchMut'];
    syncMut: KnownConnectionsCardHooks['syncMut'];
    forgetMut: KnownConnectionsCardHooks['forgetMut'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        isSuperuser: boolean;
        toast: import("@ui").ToastApi;
        qc: import("@tanstack/query-core").QueryClient;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        q: import("@tanstack/react-query").UseQueryResult<NoInfer<ConnectionsResponse>, Error>;
        switchMut: import("@tanstack/react-query").UseMutationResult<{
            restart_required?: boolean;
        }, unknown, {
            id: string;
            overwrite: boolean;
        }, void>;
        syncMut: import("@tanstack/react-query").UseMutationResult<any, unknown, string, void>;
        forgetMut: import("@tanstack/react-query").UseMutationResult<any, unknown, string, void>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get embedded(): boolean;
    get conns(): Conn[];
    get body(): import("react").JSX.Element;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_heading(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_body(): {
        children: import("react").JSX.Element;
    };
    get show_main(): boolean;
    get content_body2(): {
        children: import("react").JSX.Element;
    };
    refresh(): void;
    onSwitchExisting(c: Conn): Promise<undefined>;
    onSwitchOverwrite(c: Conn): Promise<undefined>;
    onSync(c: Conn): Promise<undefined>;
    onForget(c: Conn): Promise<undefined>;
    meta(c: Conn): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type KnownConnectionsCardStores = ReturnType<KnownConnectionsCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type KnownConnectionsCardHooks = ReturnType<KnownConnectionsCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<KnownConnectionsCardProps>>;
export default _default;
