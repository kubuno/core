/**
 * Code-behind of `BackupPanel.kbview` (converted from `BackupPanel.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './BackupPanel.kbview';
import * as __parts from './BackupPanel.parts';
export declare class BackupPanel extends ViewBase {
    tr: BackupPanelStores['t'];
    toast: BackupPanelStores['toast'];
    can: BackupPanelStores['can'];
    data: BackupPanelStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: BackupPanelStores['refetch'];
    run: BackupPanelStores['run'];
    anchor: BackupPanelStores['anchor'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        can: import("../../authz/types").CanFn;
        data: NoInfer<import("./api").BackupOverview> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").BackupOverview>, Error>>;
        run: import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
        anchor: import("react").RefObject<HTMLDivElement | null>;
        wasRunning: import("react").RefObject<boolean>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {};
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canRead(): boolean;
    get canManage(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_case_3(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        anchor: import("react").RefObject<HTMLDivElement | null>;
        t: import("i18next").TFunction<"translation", undefined>;
        canManage: boolean;
        run: import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
        data: NoInfer<import("./api").BackupOverview>;
        trigger: () => void;
        isLoading: false;
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    trigger(): void;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type BackupPanelStores = ReturnType<BackupPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type BackupPanelHooks = ReturnType<BackupPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
