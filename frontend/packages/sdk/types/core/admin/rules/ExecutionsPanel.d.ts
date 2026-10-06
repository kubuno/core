import { ViewBase } from './ExecutionsPanel.kbview';
interface Props {
    /** Pre-filter on one rule (the rule sheet's own log). */
    ruleId?: string | null;
    /** Hide the page header — the section already painted one. */
    embedded?: boolean;
}
export type { Props };
export declare class ExecutionsPanel extends ViewBase {
    accessor mode: string;
    accessor outcome: string;
    tr: ExecutionsPanelStores['t'];
    i18n: ExecutionsPanelStores['i18n'];
    isMobile: boolean;
    rule: ExecutionsPanelHooks['rule'];
    setRule: ExecutionsPanelHooks['setRule'];
    expanded: Set<number>;
    setExpanded: ExecutionsPanelStores['setExpanded'];
    rules: ExecutionsPanelStores['rules'];
    data: ExecutionsPanelHooks['data'];
    isLoading: boolean;
    isFetching: boolean;
    refetch: ExecutionsPanelHooks['refetch'];
    severityOf: Map<string, string>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        isMobile: boolean;
        expanded: Set<number>;
        setExpanded: import("react").Dispatch<import("react").SetStateAction<Set<number>>>;
        rules: import("@tanstack/react-query").UseQueryResult<NoInfer<import("./types").RulesListResponse>, Error>;
        severityOf: Map<string, string>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        rule: string;
        setRule: import("react").Dispatch<import("react").SetStateAction<string>>;
        data: NoInfer<import("./types").ExecutionRow[]> | undefined;
        isLoading: boolean;
        isFetching: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./types").ExecutionRow[]>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get rows(): NoInfer<import("./types").ExecutionRow[]>;
    get filters(): import("react").JSX.Element;
    get show_embedded(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_filters(): {
        children: import("react").JSX.Element;
    };
    get content_body(): {
        children: import("react").JSX.Element;
    };
    toggle(id: number): void;
    body(): import("react").JSX.Element;
    /** `setMode` of the TSX: a value, or an update of the previous one. */
    setMode(value: ExecutionsPanel['mode'] | ((prev: ExecutionsPanel['mode']) => ExecutionsPanel['mode'])): void;
    /** `setOutcome` of the TSX: a value, or an update of the previous one. */
    setOutcome(value: ExecutionsPanel['outcome'] | ((prev: ExecutionsPanel['outcome']) => ExecutionsPanel['outcome'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ExecutionsPanelStores = ReturnType<ExecutionsPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ExecutionsPanelHooks = ReturnType<ExecutionsPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
