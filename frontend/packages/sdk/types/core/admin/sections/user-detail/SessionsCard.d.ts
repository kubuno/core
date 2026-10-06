/**
 * Code-behind of `SessionsCard.kbview` (converted from `SessionsCard.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type DataTableColumn } from "@ui";
import type { Session, User } from "../../../types";
import { ViewBase } from './SessionsCard.kbview';
import * as __parts from './SessionsCard.parts';
export type SessionsCardProps = {
    user: User;
};
export declare class SessionsCard extends ViewBase {
    tr: SessionsCardStores['t'];
    i18n: SessionsCardStores['i18n'];
    qc: SessionsCardStores['qc'];
    toast: SessionsCardStores['toast'];
    confirm: SessionsCardStores['confirm'];
    confirmState: SessionsCardStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: SessionsCardHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: SessionsCardHooks['refetch'];
    revoke: SessionsCardHooks['revoke'];
    revokeAll: SessionsCardHooks['revokeAll'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        qc: import("@tanstack/query-core").QueryClient;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<Session[]> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<Session[]>, Error>>;
        revoke: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
        revokeAll: import("@tanstack/react-query").UseMutationResult<{
            revoked: number;
        }, Error, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get sessions(): NoInfer<Session[]>;
    get columns(): DataTableColumn<Session>[];
    get show_sessions(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        sessions: Session[];
        columns: DataTableColumn<Session>[];
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<Session[]>, Error>>;
        askRevoke: (s: Session) => Promise<void>;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, skeletonRows, onRetry, configurableColumns, minTableWidth, rowActions, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof import("../../../../ui/ConfirmDialog").default;
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
    invalidate_(): void;
    askRevoke(s: Session): Promise<void>;
    askRevokeAll(): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SessionsCardStores = ReturnType<SessionsCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type SessionsCardHooks = ReturnType<SessionsCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<SessionsCardProps>>;
export default _default;
