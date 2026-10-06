import { ViewBase } from './SettingsMovedNotice.kbview';
import * as __parts from './SettingsMovedNotice.parts';
export declare class SettingsMovedNotice extends ViewBase {
    tr: SettingsMovedNoticeStores['t'];
    can: SettingsMovedNoticeStores['can'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../authz/types").CanFn;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get targets(): string[];
    get show_case_1(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        targets: string[];
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SettingsMovedNoticeStores = ReturnType<SettingsMovedNotice['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
