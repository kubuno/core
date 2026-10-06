import { ViewBase } from './HomeSection.kbview';
import * as __parts from './HomeSection.parts';
export declare class HomeSection extends ViewBase {
    tr: HomeSectionStores['t'];
    can: HomeSectionStores['can'];
    stats: HomeSectionStores['stats'];
    isLoading: HomeSectionStores['isLoading'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../authz/types").CanFn;
        stats: NoInfer<import("./adminStats").Stats> | undefined;
        isLoading: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get hasStats(): boolean;
    get storageUsed(): number;
    get storageQuota(): number;
    get storagePct(): number;
    /** `<GettingStartedCard>`, rendered by a ReactHost. */
    get GettingStartedCard(): import("react").FunctionComponent<Readonly<{}>>;
    get show_sees_users(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        hasStats: boolean;
        num: (v?: number) => string;
        stats: NoInfer<import("./adminStats").Stats> | undefined;
        sees: (tab: string) => boolean;
    };
    /** A part of the screen still written in React (<HomeCard> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    get show_sees_modules(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        hasStats: boolean;
        num: (v?: number) => string;
        stats: NoInfer<import("./adminStats").Stats> | undefined;
        sees: (tab: string) => boolean;
    };
    /** A part of the screen still written in React (<HomeCard> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        storageUsed: number;
        storageQuota: number;
        storagePct: number;
    };
    /** A part of the screen still written in React (<HomeCard> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    get show_sees_sso(): boolean;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<HomeCard> is no .kbview element (a local or dynamic component)). */
    get Part4(): typeof __parts.Part4;
    get show_sees_alerts(): boolean;
    /** `<AlertsCard>`, rendered by a ReactHost. */
    get AlertsCard(): import("react").FunctionComponent<Readonly<{}>>;
    get show_sees_groups(): boolean;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<HomeCard> is no .kbview element (a local or dynamic component)). */
    get Part5(): typeof __parts.Part5;
    get show_sees_settings(): boolean;
    get part6_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<HomeCard> is no .kbview element (a local or dynamic component)). */
    get Part6(): typeof __parts.Part6;
    get show_sees_event_log(): boolean;
    get part7_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<HomeCard> is no .kbview element (a local or dynamic component)). */
    get Part7(): typeof __parts.Part7;
    sees(tab: string): boolean;
    num(v?: number): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type HomeSectionStores = ReturnType<HomeSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
