/**
 * Code-behind of `LdapSection.kbview` (converted from `LdapSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import ConfirmDialog from "@ui/ConfirmDialog";
import { type AuthProbe, type ConnectionProbe, type DirectoryForm, type LdapDirectory, type SyncReport } from "./types";
import { ViewBase } from './LdapSection.kbview';
import * as __parts from './LdapSection.parts';
export declare class LdapSection extends ViewBase {
    accessor editing: string | null;
    accessor probing: string | null;
    accessor probe: Record<string, ConnectionProbe>;
    accessor authProbe: Record<string, AuthProbe>;
    accessor report: Record<string, SyncReport>;
    accessor trial: {
        login: string;
        password: string;
    };
    tr: LdapSectionStores['t'];
    qc: LdapSectionStores['qc'];
    toast: LdapSectionStores['toast'];
    confirm: LdapSectionStores['confirm'];
    confirmState: LdapSectionStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    form: DirectoryForm;
    setForm: LdapSectionStores['setForm'];
    directories: LdapSectionStores['directories'];
    isLoading: boolean;
    createM: LdapSectionHooks['createM'];
    updateM: LdapSectionHooks['updateM'];
    deleteM: LdapSectionHooks['deleteM'];
    testM: LdapSectionHooks['testM'];
    testAuthM: LdapSectionHooks['testAuthM'];
    syncM: LdapSectionHooks['syncM'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        form: DirectoryForm;
        setForm: import("react").Dispatch<import("react").SetStateAction<DirectoryForm>>;
        directories: NoInfer<LdapDirectory[]> | undefined;
        isLoading: boolean;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        createM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, Record<string, unknown>, unknown>;
        updateM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, {
            id: string;
            payload: Record<string, unknown>;
        }, unknown>;
        deleteM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<{
            deactivated_accounts: number;
        }, any, {}>, unknown, string, unknown>;
        testM: import("@tanstack/react-query").UseMutationResult<ConnectionProbe, unknown, string, string>;
        testAuthM: import("@tanstack/react-query").UseMutationResult<AuthProbe, unknown, {
            id: string;
            login: string;
            password: string;
        }, unknown>;
        syncM: import("@tanstack/react-query").UseMutationResult<SyncReport, unknown, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get list(): NoInfer<LdapDirectory[]>;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part1(): typeof __parts.Part1;
    get show_editing_new(): boolean;
    /** `<LdapDirectoryForm>`, rendered by a ReactHost. */
    get LdapDirectoryForm(): import("react").FunctionComponent<Readonly<import("./LdapDirectoryForm").LdapDirectoryFormProps>>;
    get ldap_directory_form_props(): Readonly<import("./LdapDirectoryForm").LdapDirectoryFormProps>;
    get show_list_editing_new(): boolean;
    get show_not_list_editing_new(): boolean;
    get part2_props(): {
        list: LdapDirectory[];
        probe: Record<string, ConnectionProbe>;
        authProbe: Record<string, AuthProbe>;
        report: Record<string, SyncReport>;
        editing: string | null;
        form: DirectoryForm;
        setForm: import("react").Dispatch<import("react").SetStateAction<DirectoryForm>>;
        submit: () => void;
        setEditing: (value: string | null | ((prev: string | null) => string | null)) => void;
        updateM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, {
            id: string;
            payload: Record<string, unknown>;
        }, unknown>;
        t: import("i18next").TFunction<"translation", undefined>;
        onDelete: (d: LdapDirectory) => Promise<void>;
        probing: string | null;
        setProbe: (value: Record<string, ConnectionProbe> | ((prev: Record<string, ConnectionProbe>) => Record<string, ConnectionProbe>)) => void;
        testM: import("@tanstack/react-query").UseMutationResult<ConnectionProbe, unknown, string, string>;
        syncM: import("@tanstack/react-query").UseMutationResult<SyncReport, unknown, string, unknown>;
        trial: {
            login: string;
            password: string;
        };
        setTrial: (value: {
            login: string;
            password: string;
        } | ((prev: {
            login: string;
            password: string;
        }) => {
            login: string;
            password: string;
        })) => void;
        testAuthM: import("@tanstack/react-query").UseMutationResult<AuthProbe, unknown, {
            id: string;
            login: string;
            password: string;
        }, unknown>;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part2(): typeof __parts.Part2;
    get show_editing_list(): boolean;
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
    invalidate_(): Promise<void>;
    errorOf(e: unknown): string | undefined;
    submit(): void;
    onDelete(d: LdapDirectory): Promise<void>;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setEditing` of the TSX: a value, or an update of the previous one. */
    setEditing(value: string | null | ((prev: string | null) => string | null)): void;
    /** `setProbe` of the TSX: a value, or an update of the previous one. */
    setProbe(value: Record<string, ConnectionProbe> | ((prev: Record<string, ConnectionProbe>) => Record<string, ConnectionProbe>)): void;
    /** `setTrial` of the TSX: a value, or an update of the previous one. */
    setTrial(value: {
        login: string;
        password: string;
    } | ((prev: {
        login: string;
        password: string;
    }) => {
        login: string;
        password: string;
    })): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type LdapSectionStores = ReturnType<LdapSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type LdapSectionHooks = ReturnType<LdapSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
