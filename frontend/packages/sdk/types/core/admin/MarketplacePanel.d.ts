/**
 * Code-behind of `MarketplacePanel.kbview` (converted from `MarketplacePanel.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './MarketplacePanel.kbview';
import * as __parts from './MarketplacePanel.parts';
interface MarketModule {
    id: string;
    name: string;
    version: string;
    author?: string | null;
    official: boolean;
    category?: string | null;
    accent?: string | null;
    summary?: string | null;
    description?: string | null;
    license?: string | null;
    tags: string[];
    rating?: number | null;
    updated?: string | null;
    links?: {
        repo?: string | null;
        html?: string | null;
    };
    installed: boolean;
    installed_version: string | null;
    enabled?: boolean | null;
    removable: boolean;
}
interface Report {
    name: string;
    version: string;
    started: boolean;
}
export type MarketplacePanelProps = {
    onBack: () => void;
    related?: string | null;
};
export declare class MarketplacePanel extends ViewBase {
    accessor showAll: boolean;
    accessor okMsg: string | null;
    accessor errMsg: string | null;
    accessor busy: string | null;
    accessor phase: Record<string, string>;
    tr: MarketplacePanelStores['t'];
    qc: MarketplacePanelStores['qc'];
    data: MarketplacePanelStores['data'];
    isLoading: boolean;
    isError: boolean;
    install: MarketplacePanelHooks['install'];
    uninstall: MarketplacePanelHooks['uninstall'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        data: NoInfer<MarketModule[]> | undefined;
        isLoading: boolean;
        isError: boolean;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        install: import("@tanstack/react-query").UseMutationResult<Report, unknown, string, void>;
        uninstall: import("@tanstack/react-query").UseMutationResult<any, unknown, string, void>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get self(): MarketModule | undefined;
    get relatedActive(): boolean;
    get visible(): MarketModule[];
    get categories(): string[];
    get show_ok_msg(): boolean;
    get show_err_msg(): boolean;
    get show_self(): boolean;
    get span_text(): string;
    get text(): string;
    get show_related_active_visible(): boolean;
    /** A part of the screen still written in React (a list inside a list (nested Repeater)). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `categories`. */
    get rows_categories(): {
        cat: string;
        part1_props: {
            visible: MarketModule[];
            cat: string;
            busy: string | null;
            t: import("i18next").TFunction<"translation", undefined>;
            uninstall: import("@tanstack/react-query").UseMutationResult<any, unknown, string, void>;
            install: import("@tanstack/react-query").UseMutationResult<Report, unknown, string, void>;
            phase: Record<string, string>;
        };
        key: string;
    }[];
    isRelated(m: MarketModule): boolean;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click4(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MarketplacePanelStores = ReturnType<MarketplacePanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type MarketplacePanelHooks = ReturnType<MarketplacePanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<MarketplacePanelProps>>;
export default _default;
