import { ViewBase } from './MobileFab.kbview';
import * as __parts from './MobileFab.parts';
export declare class MobileFab extends ViewBase {
    accessor open: boolean;
    pathname: string;
    configs: MobileFabStores['configs'];
    isMobileVp: boolean;
    isLandscapeVp: boolean;
    allWaffleApps: MobileFabStores['allWaffleApps'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        pathname: string;
        configs: import("../store/sidebarStore").SidebarConfig[];
        isMobileVp: boolean;
        isLandscapeVp: boolean;
        allWaffleApps: import("../registry/WaffleAppRegistry").WaffleApp[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get landscape(): boolean;
    get activeConfig(): import("../store/sidebarStore").SidebarConfig | null;
    get immersive(): boolean;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        open: boolean;
        landscape: boolean;
        immersive: boolean;
        allWaffleApps: import("../registry/WaffleAppRegistry").WaffleApp[];
        setOpen: (value: MobileFab["open"] | ((prev: MobileFab["open"]) => MobileFab["open"])) => void;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    get visible(): boolean;
    /** `setOpen` of the TSX: a value, or an update of the previous one. */
    setOpen(value: MobileFab['open'] | ((prev: MobileFab['open']) => MobileFab['open'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MobileFabStores = ReturnType<MobileFab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
