/**
 * Code-behind of `HomePage.kbview` (converted from `HomePage.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { useNavigate } from 'react-router-dom';
import GridDashboard from "../widgets/GridDashboard";
import { ViewBase } from './HomePage.kbview';
import * as __parts from './HomePage.parts';
export declare class HomePage extends ViewBase {
    accessor editMode: boolean;
    tr: HomePageStores['t'];
    user: HomePageStores['user'];
    activeModules: HomePageStores['activeModules'];
    favApps: HomePageStores['favApps'];
    isMobile: boolean;
    navigate: ReturnType<typeof useNavigate>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        user: import("../types").User | null;
        activeModules: import("../types").ActiveModule[];
        favApps: import("../registry/WaffleAppRegistry").WaffleApp[];
        isMobile: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get activeIds(): Set<string>;
    get allWidgets(): import("../widgets/WidgetRegistry").WidgetDef[];
    get name(): string;
    get h(): number;
    get greetingKey(): "home.g_night" | "home.g_morning" | "home.g_afternoon" | "home.g_evening";
    get show_case_1(): boolean;
    get show_main(): boolean;
    get h1_text(): string;
    get p_text(): string;
    get show_edit_mode_is_mobile_fav_apps(): boolean;
    /** A part of the screen still written in React (<app.Icon> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `favApps`. */
    get rows_fav_apps(): {
        app: import("../registry/WaffleAppRegistry").WaffleApp;
        href: string | undefined;
        part1_props: {
            app: import("../registry/WaffleAppRegistry").WaffleApp;
        } | undefined;
        key: string;
    }[];
    get show_not_edit_mode(): boolean;
    /** `<GridDashboard>`, rendered by a ReactHost. */
    get GridDashboard(): typeof GridDashboard;
    get grid_dashboard_props(): {
        allWidgets: import("../widgets/WidgetRegistry").WidgetDef[];
        activeIds: Set<string>;
        editMode: boolean;
    };
    link_label_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type HomePageStores = ReturnType<HomePage['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
