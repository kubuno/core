import { ViewBase } from './MenusGroup.kbview';
export declare class MenusGroup extends ViewBase {
    accessor sortVal: string;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get items_source(): ({
        value: string;
        label: string;
        icon: import("react").JSX.Element;
    } | {
        value: string;
        label: string;
        icon?: undefined;
    })[];
    /** `<MockContextMenu>`, rendered by a ReactHost. */
    get MockContextMenu(): import("react").FunctionComponent<Readonly<{}>>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MenusGroupStores = ReturnType<MenusGroup['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
