import ConfirmDialog from "@ui/ConfirmDialog";
import DomainDiagnosticsCard from "./DomainDiagnosticsCard";
import { ViewBase } from './DomainDetail.kbview';
import * as __parts from './DomainDetail.parts';
export type DomainDetailProps = {
    domainId: string;
    canManage: boolean;
    /** Called after a removal, so the page can return to the list. */
    onGone: () => void;
};
export declare class DomainDetail extends ViewBase {
    accessor error: string | null;
    tr: DomainDetailStores['t'];
    toast: DomainDetailStores['toast'];
    confirm: DomainDetailStores['confirm'];
    confirmState: DomainDetailStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: DomainDetailHooks['data'];
    isLoading: boolean;
    verify: DomainDetailStores['verify'];
    promote: DomainDetailStores['promote'];
    remove: DomainDetailStores['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        verify: import("@tanstack/react-query").UseMutationResult<import("./api").Domain, Error, string, unknown>;
        promote: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<{
            domain: import("./api").Domain;
            removal_blockers: string[];
        }> | undefined;
        isLoading: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get domain(): import("./api").Domain | undefined;
    get name(): string;
    get blockers(): string[];
    get show_case_1(): boolean;
    get show_main(): boolean;
    get h2_text(): string;
    get show_domain_kind_primary(): boolean;
    get show_domain_kind_secondary(): boolean;
    get show_domain_kind_alias(): boolean;
    get dom_alias_of_name(): string | null;
    get show_domain_verified(): boolean;
    get show_not_domain_verified(): boolean;
    get show_error(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        domain: import("./api").Domain;
        domain_last_error: string | null;
        canManage: boolean;
        verify: import("@tanstack/react-query").UseMutationResult<import("./api").Domain, Error, string, unknown>;
        setError: (value: string | null | ((prev: string | null) => string | null)) => void;
        toast: import("@ui").ToastApi;
        fail: (e: unknown) => undefined;
        domain_last_checked_at: string | null;
    };
    /** A part of the screen still written in React (<Card> title: an object value for a text property). */
    get Part1(): typeof __parts.Part1;
    /** `<DomainDiagnosticsCard>`, rendered by a ReactHost. */
    get DomainDiagnosticsCard(): typeof DomainDiagnosticsCard;
    get domain_diagnostics_card_props(): {
        domain: import("./api").Domain;
        canManage: boolean;
    };
    get show_domain_kind_secondary2(): boolean;
    get part2_props(): {
        domain: import("./api").Domain;
        promote: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
        t: import("i18next").TFunction<"translation", undefined>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        setError: (value: string | null | ((prev: string | null) => string | null)) => void;
        toast: import("@ui").ToastApi;
        fail: (e: unknown) => undefined;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part2(): typeof __parts.Part2;
    get show_blockers(): boolean;
    /** The rows of the Repeater over `blockers`. */
    get rows_blockers(): {
        b: string;
        key: string;
    }[];
    get part3_props(): {
        blockers: string[];
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        t: import("i18next").TFunction<"translation", undefined>;
        domain: import("./api").Domain;
        setError: (value: string | null | ((prev: string | null) => string | null)) => void;
        onGone: () => void;
        fail: (e: unknown) => undefined;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part3(): typeof __parts.Part3;
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
    fail(e: unknown): undefined;
    /** `setError` of the TSX: a value, or an update of the previous one. */
    setError(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DomainDetailStores = ReturnType<DomainDetail['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DomainDetailHooks = ReturnType<DomainDetail['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<DomainDetailProps>>;
export default _default;
