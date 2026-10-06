import { ViewBase } from './TabsTextGroup.kbview';
import * as __parts from './TabsTextGroup.parts';
export declare class TabsTextGroup extends ViewBase {
    accessor tab: string;
    accessor rich: string;
    tr: TabsTextGroupStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        tab: string;
        setTab: (value: TabsTextGroup["tab"] | ((prev: TabsTextGroup["tab"]) => TabsTextGroup["tab"])) => void;
    };
    /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `<RichText>`, rendered by a ReactHost. */
    get RichText(): typeof import("../../../../ui/RichText").RichText;
    get rich_text_props(): {
        value: string;
        onChange: (value: TabsTextGroup["rich"] | ((prev: TabsTextGroup["rich"]) => TabsTextGroup["rich"])) => void;
        placeholder: string;
    };
    /** `setTab` of the TSX: a value, or an update of the previous one. */
    setTab(value: TabsTextGroup['tab'] | ((prev: TabsTextGroup['tab']) => TabsTextGroup['tab'])): void;
    /** `setRich` of the TSX: a value, or an update of the previous one. */
    setRich(value: TabsTextGroup['rich'] | ((prev: TabsTextGroup['rich']) => TabsTextGroup['rich'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type TabsTextGroupStores = ReturnType<TabsTextGroup['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
