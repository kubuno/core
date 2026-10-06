import { type MobileNavTab } from "../store/sidebarStore";
import { ViewBase } from './MobileNav.kbview';
export type MobileNavProps = {
    variant?: 'bottom' | 'rail';
};
export declare class MobileNav extends ViewBase {
    pathname: string;
    configs: MobileNavStores['configs'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        pathname: string;
        configs: import("../store/sidebarStore").SidebarConfig[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get variant(): "bottom" | "rail";
    get active(): import("../store/sidebarStore").SidebarConfig | null;
    get tabs(): MobileNavTab[] | undefined;
    get items(): import("react").JSX.Element[];
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_case_3(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_items(): {
        children: import("react").JSX.Element[];
    };
    get show_main(): boolean;
    get content_items2(): {
        children: import("react").JSX.Element[];
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MobileNavStores = ReturnType<MobileNav['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<MobileNavProps>>;
export default _default;
