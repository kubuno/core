import { type WaffleApp } from "../registry/WaffleAppRegistry";
import { ViewBase } from './ModulesPage.kbview';
export declare class ModulesPage extends ViewBase {
    activeModules: ModulesPageStores['activeModules'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        activeModules: import("../types").ActiveModule[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get allApps(): WaffleApp[];
    get moduleAppCount(): Record<string, number>;
    get moduleGroups(): {
        moduleId: string;
        label: string;
        apps: WaffleApp[];
    }[];
    get standaloneApps(): WaffleApp[];
    get show_case_1(): boolean;
    get show_main(): boolean;
    get show_standalone_apps(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_standalone_apps_map_render_cell(): {
        children: import("react").JSX.Element[];
    };
    /** The rows of the Repeater over `moduleGroups`. */
    get rows_module_groups(): {
        group: {
            moduleId: string;
            label: string;
            apps: WaffleApp[];
        };
        content_group_apps_map: {
            children: import("react").JSX.Element[];
        } | undefined;
        key: string;
    }[];
    byLabel(x: WaffleApp, y: WaffleApp): number;
    renderCell(app: WaffleApp): import("react").JSX.Element;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModulesPageStores = ReturnType<ModulesPage['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
