import { Slot } from "../slots/SlotRegistry";
import { ViewBase } from './MobileSettingsIndex.kbview';
import * as __parts from './MobileSettingsIndex.parts';
export declare class MobileSettingsIndex extends ViewBase {
    tr: MobileSettingsIndexStores['t'];
    navigate: MobileSettingsIndexStores['navigate'];
    nav: MobileSettingsIndexStores['nav'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        navigate: import("react-router").NavigateFunction;
        nav: import("./navigation").NavItem[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        nav: import("./navigation").NavItem[];
        navigate: import("react-router").NavigateFunction;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part1(): typeof __parts.Part1;
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MobileSettingsIndexStores = ReturnType<MobileSettingsIndex['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
