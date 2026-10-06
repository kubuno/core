/**
 * Code-behind of `SettingsGroupPanel.kbview` (converted from `SettingsGroupPanel.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type ActiveScope, type ResolvedSetting } from "./scopeTypes";
import { ViewBase } from './SettingsGroupPanel.kbview';
import * as __parts from './SettingsGroupPanel.parts';
interface Props {
    /** Nav leaf id whose keys this block paints. */
    tab: string;
    /**
     * How the block sits in its page.
     *   • `standalone` — the block IS the page (a pure-settings leaf). One
     *     readable column, whatever the count.
     *   • `tab` — the block is the "Réglages" tab beside a subsystem's content.
     *     It takes the full width the content established, and flows its
     *     categories into two columns once there are enough to fill them.
     * The block never wears a heading of its own: the page title or the tab
     * already names it, and a second "Réglages" heading only repeated that.
     */
    layout?: 'standalone' | 'tab';
}
export type { Props };
export declare class SettingsGroupPanel extends ViewBase {
    accessor edits: Record<string, unknown>;
    accessor saved: boolean;
    accessor error: string | null;
    accessor chainKey: string | null;
    tr: SettingsGroupPanelStores['t'];
    queryClient: SettingsGroupPanelStores['queryClient'];
    can: SettingsGroupPanelStores['can'];
    scope: ActiveScope;
    setScope: SettingsGroupPanelStores['setScope'];
    params: URLSearchParams;
    highlightRef: SettingsGroupPanelStores['highlightRef'];
    settings: SettingsGroupPanelHooks['settings'];
    update: SettingsGroupPanelHooks['update'];
    revert: SettingsGroupPanelHooks['revert'];
    lock: SettingsGroupPanelHooks['lock'];
    sections: {
        id: string;
        title: string;
        desc: string;
        items: ResolvedSetting[];
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        queryClient: import("@tanstack/query-core").QueryClient;
        can: import("../../authz/types").CanFn;
        scope: ActiveScope;
        setScope: import("react").Dispatch<import("react").SetStateAction<ActiveScope>>;
        params: URLSearchParams;
        highlightRef: import("react").RefObject<HTMLDivElement | null>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        settings: NoInfer<ResolvedSetting[]> | undefined;
        update: import("@tanstack/react-query").UseMutationResult<void, unknown, Record<string, unknown>, unknown>;
        revert: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, string, unknown>;
        lock: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, {
            key: string;
            locked: boolean;
        }, unknown>;
        sections: {
            id: string;
            title: string;
            desc: string;
            items: ResolvedSetting[];
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get layout(): "tab" | "standalone";
    get canRead(): boolean;
    get canManage(): boolean;
    get highlight(): string | null;
    get scopeParams(): {
        scope_type: "instance" | "org_unit";
        scope_id: string | undefined;
    };
    get pendingKeys(): string[];
    get chainSetting(): ResolvedSetting | undefined;
    get twoColumn(): boolean;
    get containerClass(): "w-full" | "max-w-2xl";
    get show_case_1(): boolean;
    get show_main(): boolean;
    /** `<SettingScopeBar>`, rendered by a ReactHost. */
    get SettingScopeBar(): import("react").FunctionComponent<Readonly<import("./SettingScopeBar").SettingScopeBarProps>>;
    get setting_scope_bar_props(): {
        scope: ActiveScope;
        onChange: import("react").Dispatch<import("react").SetStateAction<ActiveScope>>;
        sticky: boolean;
    };
    get show_can_manage(): boolean;
    get show_error(): boolean;
    get div_class(): "" | "lg:columns-2 lg:gap-x-10";
    get section_class(): string;
    /** A part of the screen still written in React (a list inside a list (nested Repeater)). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `sections`. */
    get rows_sections(): {
        section: {
            id: string;
            title: string;
            desc: string;
            items: ResolvedSetting[];
        };
        show_section_desc: boolean | undefined;
        part1_props: {
            section: {
                id: string;
                title: string;
                desc: string;
                items: ResolvedSetting[];
            };
            visibleForBranch: (s: ResolvedSetting) => boolean;
            currentValue: (s: ResolvedSetting) => unknown;
            canManage: boolean;
            setEdits: (value: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
            update: import("@tanstack/react-query").UseMutationResult<void, unknown, Record<string, unknown>, unknown>;
            highlight: string | null;
            highlightRef: import("react").RefObject<HTMLDivElement | null>;
            revert: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, string, unknown>;
            lock: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, {
                key: string;
                locked: boolean;
            }, unknown>;
            setChainKey: (value: string | null | ((prev: string | null) => string | null)) => void;
        } | undefined;
        key: string;
    }[];
    get show_pending_keys(): boolean;
    get button_text(): string;
    get show_chain_key(): boolean;
    /** `<InheritanceChainWindow>`, rendered by a ReactHost. */
    get InheritanceChainWindow(): import("react").FunctionComponent<Readonly<import("./InheritanceChainWindow").InheritanceChainWindowProps>>;
    get inheritance_chain_window_props(): Readonly<import("./InheritanceChainWindow").InheritanceChainWindowProps>;
    afterWrite(): Promise<void>;
    reportError(e: unknown): void;
    isBuffered(s: ResolvedSetting): boolean;
    currentValue(s: ResolvedSetting): unknown;
    visibleForBranch(s: ResolvedSetting): boolean;
    callout_dismiss(_sender: unknown, _args: EventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setEdits` of the TSX: a value, or an update of the previous one. */
    setEdits(value: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)): void;
    /** `setChainKey` of the TSX: a value, or an update of the previous one. */
    setChainKey(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SettingsGroupPanelStores = ReturnType<SettingsGroupPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type SettingsGroupPanelHooks = ReturnType<SettingsGroupPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
