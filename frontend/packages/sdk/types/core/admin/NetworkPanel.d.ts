import ConfirmDialog from "@ui/ConfirmDialog";
import { ViewBase } from './NetworkPanel.kbview';
import * as __parts from './NetworkPanel.parts';
interface StoredCert {
    id: string;
    source: string;
    subject: string | null;
    issuer: string | null;
    san: string[];
    not_before: string | null;
    not_after: string | null;
    is_active: boolean;
    created_at: string;
}
interface NetworkData {
    config: {
        https_enabled: boolean;
        https_port: number;
        http_redirect_to_https: boolean;
        http_redirect_port: number;
        tls_min_version: string;
        cert_mode: string;
        hsts: {
            enabled: boolean;
            max_age_days: number;
            include_subdomains: boolean;
            preload: boolean;
        };
    };
    certificate: StoredCert | null;
    certificates: StoredCert[];
    runtime: {
        https_live: boolean;
        file_override: boolean;
        restart_required: boolean;
    };
    acme: {
        directory_url: string;
        email: string;
        domains: string[];
        tos_agreed: boolean;
        last_order_status: string | null;
        last_order_detail: string | null;
        last_attempt_at: string | null;
    };
}
export declare class NetworkPanel extends ViewBase {
    accessor certPem: string;
    accessor keyPem: string;
    tr: NetworkPanelStores['t'];
    i18n: NetworkPanelStores['i18n'];
    qc: NetworkPanelStores['qc'];
    toast: NetworkPanelStores['toast'];
    confirm: NetworkPanelStores['confirm'];
    confirmState: NetworkPanelStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: NetworkPanelStores['data'];
    isLoading: boolean;
    upload: NetworkPanelHooks['upload'];
    requestAcme: NetworkPanelStores['requestAcme'];
    removeCert: NetworkPanelStores['removeCert'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        qc: import("@tanstack/query-core").QueryClient;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        data: NoInfer<NetworkData> | undefined;
        isLoading: boolean;
        requestAcme: import("@tanstack/react-query").UseMutationResult<{
            message: string;
        }, Error, void, unknown>;
        removeCert: import("@tanstack/react-query").UseMutationResult<{
            message: string;
        }, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        upload: import("@tanstack/react-query").UseMutationResult<{
            message: string;
        }, Error, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get cert(): StoredCert | null;
    get history(): StoredCert[];
    get acme(): {
        directory_url: string;
        email: string;
        domains: string[];
        tos_agreed: boolean;
        last_order_status: string | null;
        last_order_detail: string | null;
        last_attempt_at: string | null;
    } | undefined;
    get acmeMode(): boolean;
    get runtime(): {
        https_live: boolean;
        file_override: boolean;
        restart_required: boolean;
    } | undefined;
    get expiresIn(): number | null;
    get text(): string;
    get p_text(): string;
    get show_runtime_file_override(): boolean;
    get title(): string;
    get callout_text(): string;
    get show_runtime_restart_required(): boolean;
    get title2(): string;
    get callout_text2(): string;
    get show_runtime_https_live(): boolean;
    get show_not_runtime_https_live(): boolean;
    get div_text(): string;
    get div_text2(): string;
    get h2_text(): string;
    get show_cert(): boolean;
    get show_not_cert(): boolean;
    get span_text(): string;
    get span_text2(): string;
    get show_cert_san(): boolean;
    get span_text3(): string;
    get span_text4(): string;
    get span_text5(): string;
    get span_text6(): string;
    get show_cert_not_after(): boolean;
    get span_text7(): string;
    get span_text8(): string;
    get show_expires_in(): boolean;
    get span_class(): "text-text-tertiary" | "text-warning" | "text-danger";
    get span_text9(): string;
    get div_text3(): string;
    get part1_props(): {
        askDelete: (c: StoredCert) => Promise<void>;
        cert: StoredCert;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part2(): typeof __parts.Part2;
    get div_text4(): string;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        certPem: string;
        setCertPem: (value: NetworkPanel["certPem"] | ((prev: NetworkPanel["certPem"]) => NetworkPanel["certPem"])) => void;
    };
    /** A part of the screen still written in React (<TextArea> spellCheck: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        keyPem: string;
        setKeyPem: (value: NetworkPanel["keyPem"] | ((prev: NetworkPanel["keyPem"]) => NetworkPanel["keyPem"])) => void;
    };
    /** A part of the screen still written in React (<TextArea> spellCheck: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get p_text2(): string;
    get part5_props(): {
        upload: import("@tanstack/react-query").UseMutationResult<{
            message: string;
        }, Error, void, unknown>;
        certPem: string;
        keyPem: string;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part5(): typeof __parts.Part5;
    get h2_text2(): string;
    get p_text3(): string;
    get show_acme(): boolean;
    get span_text10(): string;
    get span_text11(): string;
    get show_acme_last_order(): boolean;
    get span_text12(): string;
    get span_class2(): "text-text-tertiary" | "text-success" | "text-danger";
    get span_text13(): string;
    get show_acme_last_attempt(): boolean;
    get span_text14(): string;
    get show_acme_last_order2(): boolean;
    get div_text5(): string;
    get part6_props(): {
        requestAcme: import("@tanstack/react-query").UseMutationResult<{
            message: string;
        }, Error, void, unknown>;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part6(): typeof __parts.Part6;
    get show_history(): boolean;
    get h2_text3(): string;
    get p_text4(): string;
    /** A part of the screen still written in React (<Button> with element children). */
    get Part7(): typeof __parts.Part7;
    /** The rows of the Repeater over `history`. */
    get rows_history(): {
        c: StoredCert;
        div_text: string | undefined;
        div_text2: string | undefined;
        part7_props: {
            askDelete: (c: StoredCert) => Promise<void>;
            c: StoredCert;
            removeCert: import("@tanstack/react-query").UseMutationResult<{
                message: string;
            }, Error, string, unknown>;
            t: import("i18next").TFunction<"translation", undefined>;
        } | undefined;
        key: string;
    }[];
    /** `<SettingsGroupPanel>`, rendered by a ReactHost. */
    get SettingsGroupPanel(): import("react").FunctionComponent<Readonly<import("./settings/SettingsGroupPanel").Props>>;
    get settings_group_panel_props(): {
        tab: string;
    };
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
        variant?: import("@ui").ConfirmVariant;
        hideCancel?: boolean;
    };
    askDelete(c: StoredCert): Promise<void>;
    /** `setCertPem` of the TSX: a value, or an update of the previous one. */
    setCertPem(value: NetworkPanel['certPem'] | ((prev: NetworkPanel['certPem']) => NetworkPanel['certPem'])): void;
    /** `setKeyPem` of the TSX: a value, or an update of the previous one. */
    setKeyPem(value: NetworkPanel['keyPem'] | ((prev: NetworkPanel['keyPem']) => NetworkPanel['keyPem'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type NetworkPanelStores = ReturnType<NetworkPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type NetworkPanelHooks = ReturnType<NetworkPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
